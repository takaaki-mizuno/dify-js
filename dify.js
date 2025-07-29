/**
 * Dify API JavaScript Client Library
 * @version 0.1.0
 * @description A browser-compatible client library for Dify Chat and Workflow APIs
 * @author Dify
 */

(function(global, factory) {
    'use strict';
    
    if (typeof module === 'object' && typeof module.exports === 'object') {
        // CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else {
        // Browser globals
        global.Dify = factory();
    }
})(typeof window !== 'undefined' ? window : this, function() {
    'use strict';

    /**
     * Dify APIクライアント
     * @constructor
     * @param {Object} options - 設定オプション
     * @param {string} options.api_key - Dify API キー
     * @param {string} [options.base_url] - ベースURL（デフォルト: https://api.dify.ai/v1）
     *                                     セルフホスト版の場合: https://your-instance.com/v1
     */
    function Dify(options) {
        if (!(this instanceof Dify)) {
            return new Dify(options);
        }

        this.config = {
            api_key: options.api_key,
            base_url: options.base_url || 'https://api.dify.ai/v1'  // クラウド版デフォルト、セルフホスト版は要設定
        };

        if (!this.config.api_key) {
            throw new Error('API key is required');
        }

        // ブラウザ互換性のためのfetch polyfill
        this._fetch = this._getFetch();
    }

    /**
     * ブラウザ互換性のためのfetch関数を取得
     * @private
     */
    Dify.prototype._getFetch = function() {
        if (typeof fetch !== 'undefined') {
            return fetch.bind(window);
        }
        
        // 古いブラウザ用のXMLHttpRequestフォールバック
        return function(url, options) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                var method = options.method || 'GET';
                
                xhr.open(method, url);
                
                // ヘッダーを設定
                if (options.headers) {
                    for (var key in options.headers) {
                        xhr.setRequestHeader(key, options.headers[key]);
                    }
                }
                
                xhr.onload = function() {
                    var response = {
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        json: function() {
                            return Promise.resolve(JSON.parse(xhr.responseText));
                        },
                        text: function() {
                            return Promise.resolve(xhr.responseText);
                        }
                    };
                    resolve(response);
                };
                
                xhr.onerror = function() {
                    reject(new Error('Network error'));
                };
                
                xhr.send(options.body);
            });
        };
    };

    /**
     * HTTPリクエストを送信
     * @private
     */
    Dify.prototype._request = function(endpoint, options) {
        var url = this.config.base_url + endpoint;
        var defaultOptions = {
            headers: {
                'Authorization': 'Bearer ' + this.config.api_key,
                'Content-Type': 'application/json'
            }
        };

        // オプションをマージ
        var mergedOptions = this._mergeObjects(defaultOptions, options || {});
        
        return this._fetch(url, mergedOptions)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                return response.json();
            });
    };

    /**
     * Server-Sent Eventsを処理
     * @private
     */
    Dify.prototype._handleStreamResponse = function(endpoint, options, onMessage, onError, onComplete) {
        var url = this.config.base_url + endpoint;
        var defaultOptions = {
            headers: {
                'Authorization': 'Bearer ' + this.config.api_key,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            }
        };

        var mergedOptions = this._mergeObjects(defaultOptions, options || {});

        // EventSourceが利用可能な場合
        if (typeof EventSource !== 'undefined' && mergedOptions.method === 'GET') {
            var eventSource = new EventSource(url + '?' + this._objectToQueryString(mergedOptions.body || {}));
            
            eventSource.onmessage = function(event) {
                try {
                    var data = JSON.parse(event.data);
                    onMessage(data);
                } catch (error) {
                    onError(error);
                }
            };
            
            eventSource.onerror = function(error) {
                onError(error);
                eventSource.close();
            };
            
            return {
                close: function() {
                    eventSource.close();
                    if (onComplete) onComplete();
                }
            };
        }

        // フォールバック：fetch with streaming
        return this._fetch(url, mergedOptions)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                
                var reader = response.body && response.body.getReader();
                if (!reader) {
                    throw new Error('Streaming not supported');
                }
                
                var decoder = new TextDecoder();
                var buffer = '';
                
                function processStream() {
                    return reader.read().then(function(result) {
                        if (result.done) {
                            if (onComplete) onComplete();
                            return;
                        }
                        
                        buffer += decoder.decode(result.value, {stream: true});
                        var lines = buffer.split('\n');
                        buffer = lines.pop(); // 最後の不完全な行を保持
                        
                        lines.forEach(function(line) {
                            if (line.startsWith('data: ')) {
                                try {
                                    var data = JSON.parse(line.slice(6));
                                    onMessage(data);
                                } catch (error) {
                                    // JSON解析エラーを無視（不完全なデータの可能性）
                                }
                            }
                        });
                        
                        return processStream();
                    });
                }
                
                processStream().catch(onError);
                
                return {
                    close: function() {
                        reader.cancel();
                        if (onComplete) onComplete();
                    }
                };
            })
            .catch(onError);
    };

    /**
     * オブジェクトをマージ
     * @private
     */
    Dify.prototype._mergeObjects = function(target, source) {
        var result = {};
        
        // targetのプロパティをコピー
        for (var key in target) {
            if (target.hasOwnProperty(key)) {
                if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                    result[key] = this._mergeObjects(target[key], source[key] || {});
                } else {
                    result[key] = target[key];
                }
            }
        }
        
        // sourceのプロパティをコピー
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this._mergeObjects(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    };

    /**
     * オブジェクトをクエリ文字列に変換
     * @private
     */
    Dify.prototype._objectToQueryString = function(obj) {
        var str = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
            }
        }
        return str.join('&');
    };

    // ================================
    // Chat API メソッド
    // ================================

    /**
     * チャットメッセージを送信
     * @param {Object} options - メッセージオプション
     * @param {string} options.query - ユーザーの質問
     * @param {Object} [options.inputs] - 入力変数
     * @param {string} [options.response_mode] - 応答モード（'streaming' または 'blocking'）
     * @param {string} options.user - ユーザー識別子
     * @param {string} [options.conversation_id] - 会話ID
     * @param {Array} [options.files] - ファイルリスト
     * @param {boolean} [options.auto_generate_name] - タイトル自動生成
     * @param {Function} [onMessage] - ストリーミング時のメッセージハンドラー
     * @param {Function} [onError] - エラーハンドラー
     * @param {Function} [onComplete] - 完了ハンドラー
     */
    Dify.prototype.sendChatMessage = function(options, onMessage, onError, onComplete) {
        var requestData = {
            query: options.query,
            inputs: options.inputs || {},
            response_mode: options.response_mode || 'blocking',
            user: options.user,
            conversation_id: options.conversation_id || '',
            files: options.files || [],
            auto_generate_name: options.auto_generate_name !== false
        };

        var requestOptions = {
            method: 'POST',
            body: JSON.stringify(requestData)
        };

        if (options.response_mode === 'streaming') {
            return this._handleStreamResponse('/chat-messages', requestOptions, onMessage, onError, onComplete);
        } else {
            return this._request('/chat-messages', requestOptions);
        }
    };

    /**
     * ファイルをアップロード
     * @param {File} file - アップロードするファイル
     * @param {string} user - ユーザー識別子
     */
    Dify.prototype.uploadFile = function(file, user) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('user', user);

        var requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.config.api_key
            },
            body: formData
        };

        return this._fetch(this.config.base_url + '/files/upload', requestOptions)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                return response.json();
            });
    };

    /**
     * 生成を停止
     * @param {string} taskId - タスクID
     * @param {string} user - ユーザー識別子
     */
    Dify.prototype.stopChatMessage = function(taskId, user) {
        return this._request('/chat-messages/' + taskId + '/stop', {
            method: 'POST',
            body: JSON.stringify({ user: user })
        });
    };

    /**
     * メッセージフィードバックを送信
     * @param {string} messageId - メッセージID
     * @param {string} rating - 評価（'like', 'dislike', null）
     * @param {string} user - ユーザー識別子
     * @param {string} [content] - フィードバック内容
     */
    Dify.prototype.sendMessageFeedback = function(messageId, rating, user, content) {
        return this._request('/messages/' + messageId + '/feedbacks', {
            method: 'POST',
            body: JSON.stringify({
                rating: rating,
                user: user,
                content: content || ''
            })
        });
    };

    /**
     * 推奨質問を取得
     * @param {string} messageId - メッセージID
     * @param {string} user - ユーザー識別子
     */
    Dify.prototype.getSuggestedQuestions = function(messageId, user) {
        return this._request('/messages/' + messageId + '/suggested?user=' + encodeURIComponent(user), {
            method: 'GET'
        });
    };

    /**
     * 会話履歴を取得
     * @param {Object} options - 取得オプション
     * @param {string} options.conversation_id - 会話ID
     * @param {string} options.user - ユーザー識別子
     * @param {string} [options.first_id] - 最初のメッセージID
     * @param {number} [options.limit] - 取得件数
     */
    Dify.prototype.getMessages = function(options) {
        var params = {
            conversation_id: options.conversation_id,
            user: options.user,
            first_id: options.first_id || '',
            limit: options.limit || 20
        };

        return this._request('/messages?' + this._objectToQueryString(params), {
            method: 'GET'
        });
    };

    /**
     * 会話リストを取得
     * @param {Object} options - 取得オプション
     * @param {string} options.user - ユーザー識別子
     * @param {string} [options.last_id] - 最後のレコードID
     * @param {number} [options.limit] - 取得件数
     * @param {string} [options.sort_by] - ソートフィールド
     */
    Dify.prototype.getConversations = function(options) {
        var params = {
            user: options.user,
            last_id: options.last_id || '',
            limit: options.limit || 20,
            sort_by: options.sort_by || '-updated_at'
        };

        return this._request('/conversations?' + this._objectToQueryString(params), {
            method: 'GET'
        });
    };

    /**
     * 会話を削除
     * @param {string} conversationId - 会話ID
     * @param {string} user - ユーザー識別子
     */
    Dify.prototype.deleteConversation = function(conversationId, user) {
        return this._request('/conversations/' + conversationId, {
            method: 'DELETE',
            body: JSON.stringify({ user: user })
        });
    };

    /**
     * 会話名を変更
     * @param {string} conversationId - 会話ID
     * @param {Object} options - 変更オプション
     * @param {string} [options.name] - 新しい名前
     * @param {boolean} [options.auto_generate] - 自動生成
     * @param {string} options.user - ユーザー識別子
     */
    Dify.prototype.renameConversation = function(conversationId, options) {
        return this._request('/conversations/' + conversationId + '/name', {
            method: 'POST',
            body: JSON.stringify({
                name: options.name || '',
                auto_generate: options.auto_generate || false,
                user: options.user
            })
        });
    };

    // ================================
    // Workflow API メソッド
    // ================================

    /**
     * ワークフローを実行
     * @param {Object} options - 実行オプション
     * @param {Object} options.inputs - 入力変数
     * @param {string} [options.response_mode] - 応答モード（'streaming' または 'blocking'）
     * @param {string} options.user - ユーザー識別子
     * @param {Array} [options.files] - ファイルリスト
     * @param {Function} [onMessage] - ストリーミング時のメッセージハンドラー
     * @param {Function} [onError] - エラーハンドラー
     * @param {Function} [onComplete] - 完了ハンドラー
     */
    Dify.prototype.runWorkflow = function(options, onMessage, onError, onComplete) {
        var requestData = {
            inputs: options.inputs,
            response_mode: options.response_mode || 'blocking',
            user: options.user,
            files: options.files || []
        };

        var requestOptions = {
            method: 'POST',
            body: JSON.stringify(requestData)
        };

        if (options.response_mode === 'streaming') {
            return this._handleStreamResponse('/workflows/run', requestOptions, onMessage, onError, onComplete);
        } else {
            return this._request('/workflows/run', requestOptions);
        }
    };

    /**
     * ワークフロー実行詳細を取得
     * @param {string} workflowRunId - ワークフロー実行ID
     */
    Dify.prototype.getWorkflowRun = function(workflowRunId) {
        return this._request('/workflows/run/' + workflowRunId, {
            method: 'GET'
        });
    };

    /**
     * ワークフロー生成を停止
     * @param {string} taskId - タスクID
     * @param {string} user - ユーザー識別子
     */
    Dify.prototype.stopWorkflow = function(taskId, user) {
        return this._request('/workflows/tasks/' + taskId + '/stop', {
            method: 'POST',
            body: JSON.stringify({ user: user })
        });
    };

    /**
     * ワークフローログを取得
     * @param {Object} [options] - 取得オプション
     * @param {string} [options.keyword] - 検索キーワード
     * @param {string} [options.status] - ステータス
     * @param {number} [options.page] - ページ番号
     * @param {number} [options.limit] - 取得件数
     */
    Dify.prototype.getWorkflowLogs = function(options) {
        options = options || {};
        var params = {
            keyword: options.keyword || '',
            status: options.status || '',
            page: options.page || 1,
            limit: options.limit || 20
        };

        return this._request('/workflows/logs?' + this._objectToQueryString(params), {
            method: 'GET'
        });
    };

    // ================================
    // 共通 API メソッド
    // ================================

    /**
     * アプリケーション基本情報を取得
     */
    Dify.prototype.getAppInfo = function() {
        return this._request('/info', {
            method: 'GET'
        });
    };

    /**
     * アプリケーションパラメータ情報を取得
     */
    Dify.prototype.getAppParameters = function() {
        return this._request('/parameters', {
            method: 'GET'
        });
    };

    /**
     * WebApp設定を取得
     */
    Dify.prototype.getAppSite = function() {
        return this._request('/site', {
            method: 'GET'
        });
    };

    return Dify;
});
