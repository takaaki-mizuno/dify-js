# Dify JavaScript Client Library

Tiny vanilla-JS wrapper for the Dify API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES5+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Browser Compatible](https://img.shields.io/badge/Browser-Compatible-green.svg)](https://caniuse.com/)

## English | [日本語](#日本語ドキュメント)

### Overview

This is a lightweight, browser-compatible JavaScript library for interacting with Dify's Chat and Workflow APIs. No dependencies required - just include the script and start building!

### Features

- 🌐 **Browser Compatible**: Works in all modern browsers (IE11+)
- 📦 **Zero Dependencies**: Pure vanilla JavaScript
- 🔄 **Real-time Streaming**: Support for streaming responses
- 💬 **Chat API**: Full support for conversational AI
- ⚡ **Workflow API**: Execute and monitor workflows
- 📁 **File Upload**: Handle file uploads seamlessly
- 🎯 **Easy to Use**: Simple and intuitive API

### Quick Start

#### 1. Include the Library

**Option A: From CDN (Recommended)**
```html
<script src="https://cdn.jsdelivr.net/gh/takaaki-mizuno/dify-js@0.1.0/dify.js"></script>
```

**Option B: Download and Host Yourself**
1. Download `dify.js` from this repository
2. Place it in your website folder
3. Include it in your HTML:
```html
<script src="path/to/dify.js"></script>
```

#### 2. Initialize the Client

```javascript
// Replace 'your_api_key_here' with your actual Dify API key
const dify = new Dify({
    api_key: 'your_api_key_here'
});
```

**🔑 How to get your API key:**
1. Go to your Dify dashboard
2. Navigate to your app settings
3. Find the "API Access" section
4. Copy your API key

#### 3. Your First Chat Message

```javascript
// Send a simple message
dify.sendChatMessage({
    query: 'Hello! How are you today?',
    user: 'user-123'  // Any unique identifier for your user
}).then(function(response) {
    console.log('AI Response:', response.answer);
    // Display the response on your webpage
    document.getElementById('response').textContent = response.answer;
}).catch(function(error) {
    console.error('Error:', error);
});
```

### Complete HTML Example

Here's a complete working example you can copy and paste:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dify Chat Example</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chat-container { max-width: 600px; margin: 0 auto; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user-message { background-color: #007bff; color: white; text-align: right; }
        .ai-message { background-color: #f8f9fa; border: 1px solid #dee2e6; }
        input[type="text"] { width: 70%; padding: 10px; }
        button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>Chat with Dify AI</h1>
        <div id="chat-messages"></div>
        <div>
            <input type="text" id="user-input" placeholder="Type your message here..." />
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/gh/takaaki-mizuno/dify-js@0.1.0/dify.js"></script>
    <script>
        // Initialize Dify client
        const dify = new Dify({
            api_key: 'your_api_key_here'  // Replace with your actual API key
        });

        function addMessage(message, isUser) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
            messageDiv.textContent = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function sendMessage() {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addMessage(message, true);
            input.value = '';
            
            // Send to Dify
            dify.sendChatMessage({
                query: message,
                user: 'user-123'
            }).then(function(response) {
                addMessage(response.answer, false);
            }).catch(function(error) {
                addMessage('Error: ' + error.message, false);
            });
        }

        // Allow sending message with Enter key
        document.getElementById('user-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

### Advanced Features

#### Streaming Responses (Real-time)

For real-time responses that appear word by word:

```javascript
dify.sendChatMessage({
    query: 'Tell me a story',
    user: 'user-123',
    response_mode: 'streaming'  // Enable streaming
}, 
function onMessage(data) {
    // This function is called for each piece of the response
    if (data.event === 'message') {
        console.log('Partial response:', data.answer);
        // Add this piece to your display
        document.getElementById('response').textContent += data.answer;
    }
}, 
function onError(error) {
    console.error('Streaming error:', error);
}, 
function onComplete() {
    console.log('Response complete!');
});
```

#### File Upload

```javascript
// HTML: <input type="file" id="file-input">
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];

if (file) {
    dify.uploadFile(file, 'user-123')
        .then(function(result) {
            console.log('File uploaded! ID:', result.id);
            
            // Now use the file in a message
            dify.sendChatMessage({
                query: 'Please analyze this file',
                user: 'user-123',
                files: [{
                    type: 'document',
                    transfer_method: 'local_file',
                    upload_file_id: result.id
                }]
            }).then(function(response) {
                console.log('Analysis:', response.answer);
            });
        })
        .catch(function(error) {
            console.error('Upload failed:', error);
        });
}
```

#### Workflow API

```javascript
// Execute a workflow
dify.runWorkflow({
    inputs: {
        text: 'Hello World',
        number: 42
    },
    user: 'user-123'
}).then(function(response) {
    console.log('Workflow result:', response.data.outputs);
}).catch(function(error) {
    console.error('Workflow error:', error);
});
```

### API Reference

#### Core Methods

##### `new Dify(options)`
- `options.api_key` (string, required): Your Dify API key
- `options.base_url` (string, optional): Custom API base URL

##### `sendChatMessage(options, onMessage, onError, onComplete)`
- `options.query` (string, required): User's message
- `options.user` (string, required): User identifier
- `options.response_mode` (string): 'blocking' or 'streaming'
- `options.conversation_id` (string): Continue existing conversation
- `options.inputs` (object): App variables
- `options.files` (array): File attachments
- Callbacks (for streaming only): `onMessage`, `onError`, `onComplete`

##### `uploadFile(file, user)`
- `file` (File): File object from input element
- `user` (string): User identifier

##### `runWorkflow(options, onMessage, onError, onComplete)`
- `options.inputs` (object, required): Workflow input variables
- `options.user` (string, required): User identifier
- `options.response_mode` (string): 'blocking' or 'streaming'

### Error Handling

Always handle errors to provide a good user experience:

```javascript
dify.sendChatMessage({
    query: 'Hello',
    user: 'user-123'
}).then(function(response) {
    // Success
    console.log(response.answer);
}).catch(function(error) {
    // Handle different types of errors
    if (error.message.includes('401')) {
        alert('Invalid API key. Please check your configuration.');
    } else if (error.message.includes('429')) {
        alert('Too many requests. Please wait a moment.');
    } else {
        alert('Something went wrong: ' + error.message);
    }
});
```

### Browser Support

- ✅ Chrome 49+
- ✅ Firefox 52+
- ✅ Safari 10+
- ✅ Edge 12+
- ✅ Internet Explorer 11

---

## 日本語ドキュメント

### 概要

DifyのChat APIとWorkflow APIを簡単に使えるJavaScriptライブラリです。依存関係なし、ブラウザですぐに使えます。

### 特徴

- 🌐 **ブラウザ対応**: 全ての主要ブラウザで動作（IE11以上）
- 📦 **依存関係なし**: 純粋なバニラJavaScript
- 🔄 **リアルタイムストリーミング**: ストリーミング応答をサポート
- 💬 **Chat API**: 対話型AIの完全サポート
- ⚡ **Workflow API**: ワークフローの実行と監視
- 📁 **ファイルアップロード**: シームレスなファイル処理
- 🎯 **使いやすい**: シンプルで直感的なAPI

### クイックスタート

#### 1. ライブラリを読み込む

**方法A: CDNから読み込み（推奨）**
```html
<script src="https://cdn.jsdelivr.net/gh/takaaki-mizuno/dify-js@0.1.0/dify.js"></script>
```

**方法B: ダウンロードして自分でホスト**
1. このリポジトリから`dify.js`をダウンロード
2. あなたのウェブサイトフォルダに配置
3. HTMLに含める：
```html
<script src="path/to/dify.js"></script>
```

#### 2. クライアントを初期化

```javascript
// 'your_api_key_here'を実際のDify APIキーに置き換えてください
const dify = new Dify({
    api_key: 'your_api_key_here'
});
```

**🔑 APIキーの取得方法：**
1. Difyダッシュボードにアクセス
2. アプリ設定に移動
3. 「API アクセス」セクションを見つける
4. APIキーをコピー

#### 3. 最初のチャットメッセージ

```javascript
// シンプルなメッセージを送信
dify.sendChatMessage({
    query: 'こんにちは！元気ですか？',
    user: 'user-123'  // ユーザーの一意識別子
}).then(function(response) {
    console.log('AI応答:', response.answer);
    // ウェブページに応答を表示
    document.getElementById('response').textContent = response.answer;
}).catch(function(error) {
    console.error('エラー:', error);
});
```

### 完全なHTMLサンプル

コピペで使える完全な動作サンプル：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dify チャットサンプル</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chat-container { max-width: 600px; margin: 0 auto; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user-message { background-color: #007bff; color: white; text-align: right; }
        .ai-message { background-color: #f8f9fa; border: 1px solid #dee2e6; }
        input[type="text"] { width: 70%; padding: 10px; }
        button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>Dify AIとチャット</h1>
        <div id="chat-messages"></div>
        <div>
            <input type="text" id="user-input" placeholder="メッセージを入力してください..." />
            <button onclick="sendMessage()">送信</button>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/gh/takaaki-mizuno/dify-js@0.1.0/dify.js"></script>
    <script>
        // Difyクライアントを初期化
        const dify = new Dify({
            api_key: 'your_api_key_here'  // 実際のAPIキーに置き換えてください
        });

        function addMessage(message, isUser) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
            messageDiv.textContent = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function sendMessage() {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // ユーザーメッセージをチャットに追加
            addMessage(message, true);
            input.value = '';
            
            // Difyに送信
            dify.sendChatMessage({
                query: message,
                user: 'user-123'
            }).then(function(response) {
                addMessage(response.answer, false);
            }).catch(function(error) {
                addMessage('エラー: ' + error.message, false);
            });
        }

        // Enterキーでメッセージ送信
        document.getElementById('user-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

### 高度な機能

#### ストリーミング応答（リアルタイム）

文字ごとにリアルタイムで表示される応答：

```javascript
dify.sendChatMessage({
    query: '物語を教えて',
    user: 'user-123',
    response_mode: 'streaming'  // ストリーミングを有効化
}, 
function onMessage(data) {
    // 応答の各部分に対してこの関数が呼ばれます
    if (data.event === 'message') {
        console.log('部分応答:', data.answer);
        // この部分を表示に追加
        document.getElementById('response').textContent += data.answer;
    }
}, 
function onError(error) {
    console.error('ストリーミングエラー:', error);
}, 
function onComplete() {
    console.log('応答完了！');
});
```

#### ファイルアップロード

```javascript
// HTML: <input type="file" id="file-input">
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];

if (file) {
    dify.uploadFile(file, 'user-123')
        .then(function(result) {
            console.log('ファイルアップロード完了！ ID:', result.id);
            
            // ファイルをメッセージで使用
            dify.sendChatMessage({
                query: 'このファイルを分析してください',
                user: 'user-123',
                files: [{
                    type: 'document',
                    transfer_method: 'local_file',
                    upload_file_id: result.id
                }]
            }).then(function(response) {
                console.log('分析結果:', response.answer);
            });
        })
        .catch(function(error) {
            console.error('アップロード失敗:', error);
        });
}
```

#### ワークフローAPI

```javascript
// ワークフローを実行
dify.runWorkflow({
    inputs: {
        text: 'Hello World',
        number: 42
    },
    user: 'user-123'
}).then(function(response) {
    console.log('ワークフロー結果:', response.data.outputs);
}).catch(function(error) {
    console.error('ワークフローエラー:', error);
});
```

### APIリファレンス

#### 主要メソッド

##### `new Dify(options)`
- `options.api_key` (string, 必須): Dify APIキー
- `options.base_url` (string, オプション): カスタムAPIベースURL

##### `sendChatMessage(options, onMessage, onError, onComplete)`
- `options.query` (string, 必須): ユーザーのメッセージ
- `options.user` (string, 必須): ユーザー識別子
- `options.response_mode` (string): 'blocking' または 'streaming'
- `options.conversation_id` (string): 既存の会話を継続
- `options.inputs` (object): アプリ変数
- `options.files` (array): ファイル添付
- コールバック（ストリーミングのみ）: `onMessage`, `onError`, `onComplete`

##### `uploadFile(file, user)`
- `file` (File): input要素からのFileオブジェクト
- `user` (string): ユーザー識別子

##### `runWorkflow(options, onMessage, onError, onComplete)`
- `options.inputs` (object, 必須): ワークフロー入力変数
- `options.user` (string, 必須): ユーザー識別子
- `options.response_mode` (string): 'blocking' または 'streaming'

### エラーハンドリング

良いユーザー体験のため、常にエラーを処理してください：

```javascript
dify.sendChatMessage({
    query: 'こんにちは',
    user: 'user-123'
}).then(function(response) {
    // 成功
    console.log(response.answer);
}).catch(function(error) {
    // 異なるタイプのエラーを処理
    if (error.message.includes('401')) {
        alert('APIキーが無効です。設定を確認してください。');
    } else if (error.message.includes('429')) {
        alert('リクエストが多すぎます。少しお待ちください。');
    } else {
        alert('何かエラーが発生しました: ' + error.message);
    }
});
```

### ブラウザサポート

- ✅ Chrome 49以上
- ✅ Firefox 52以上
- ✅ Safari 10以上
- ✅ Edge 12以上
- ✅ Internet Explorer 11

### よくある質問

**Q: APIキーはどこで取得できますか？**
A: Difyダッシュボードのアプリ設定 > API アクセス で取得できます。

**Q: ストリーミングと通常モードの違いは？**
A: ストリーミングはリアルタイムで応答が表示され、通常モードは完全な応答を一度に受け取ります。

**Q: ファイルアップロードに制限はありますか？**
A: はい、Difyの設定によりますが、通常は15MBまでです。詳細はDifyドキュメントを確認してください。

**Q: エラーが発生した場合はどうすればよいですか？**
A: ブラウザの開発者ツール（F12）でコンソールを確認し、エラーメッセージを読んでください。APIキー、ネットワーク接続、リクエスト形式を確認してください。

### ライセンス

MIT License

### 貢献

バグ報告や機能要求は[Issues](https://github.com/takaaki-mizuno/dify-js/issues)までお願いします。

