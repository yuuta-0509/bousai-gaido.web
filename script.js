// 多言語ステップ案内
const steps = {
    ja: [
        "まず、身の安全を確保してください。次のステップに進むには、できた。と言って下さい。",
        "近くの避難所に向かってください。次のステップに進むには、できた。と言って下さい。",
        "避難所に到着したら、安全確認をしてください。次のステップに進むには、できた。と言って下さい。"
    ],
    en: [
        "First, ensure your safety. Please say 'done' to proceed to the next step.",
        "Proceed to the nearest shelter. Please say 'done' to proceed to the next step.",
        "Once at the shelter, verify your safety. Please say 'done' to proceed to the next step."
    ],
    zh: [
        "首先，确保您的安全。请说'完成'以继续下一步。",
        "前往最近的避难所。请说'完成'以继续下一步。",
        "到达避难所后，确保您的安全。请说'完成'以继续下一步。"
    ],
    ko: [
        "먼저 안전을 확보하세요. 다음 단계로 진행하려면 '완료'라고 말씀해 주세요.",
        "가장 가까운 대피소로 이동하세요. 다음 단계로 진행하려면 '완료'라고 말씀해 주세요.",
        "대피소에 도착하면 안전을 확인하세요. 다음 단계로 진행하려면 '완료'라고 말씀해 주세요."
    ]
};

let currentStep = 0;
let selectedLanguage = 'ja'; // 初期言語を日本語に設定
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
let recognitionTimeout; // タイムアウト管理用
let voices = []; // 音声リストを格納
let isGuideCompleted = false; // ガイドが完了したかどうかのフラグ
let isRecognitionActive = false; // 音声認識がアクティブかどうかのフラグ

// 音声リストを取得
function loadVoices() {
    voices = speechSynthesis.getVoices();
}

// 音声合成設定
function speak(text) {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 言語に応じて音声を設定
        let selectedVoice;
        if (selectedLanguage === 'ja') {
            selectedVoice = voices.find(voice => voice.name === 'Hattori'); // 日本語用の音声を選択
            recognition.lang = 'ja-JP'; // 日本語用の言語設定
        } else if (selectedLanguage === 'en') {
            selectedVoice = voices.find(voice => voice.name === 'Google US English'); // 英語用の音声を選択
            recognition.lang = 'en-US'; // 英語用の言語設定
        } else if (selectedLanguage === 'zh') {
            selectedVoice = voices.find(voice => voice.name === 'Google 普通话'); // 中国語用の音声を選択
            recognition.lang = 'zh-CN'; // 中国語用の言語設定
        } else if (selectedLanguage === 'ko') {
            selectedVoice = voices.find(voice => voice.name === 'Google 한국의'); // 韓国語用の音声を選択
            recognition.lang = 'ko-KR'; // 韓国語用の言語設定
        }

        utterance.voice = selectedVoice; // 選択した音声を設定
        utterance.lang = recognition.lang;

        // 読み上げ終了時にresolveを呼ぶ
        utterance.onend = resolve;
        utterance.onerror = (e) => {
            console.error("音声合成エラー:", e);
            resolve(); // エラー時も解決する
        };
        
        speechSynthesis.speak(utterance);
    });
}

// 案内開始
async function startGuide() {
    if (currentStep < steps[selectedLanguage].length) {
        const guideText = steps[selectedLanguage][currentStep];
        document.getElementById("guide-text").textContent = guideText; // テキスト表示
        await speak(guideText); // 音声読み上げ
        isRecognitionActive = true; // 音声認識をアクティブにする
        recognition.start(); // 音声認識開始

        // 15秒後にタイムアウトを設定
        recognitionTimeout = setTimeout(() => {
            isRecognitionActive = false; // 音声認識を非アクティブにする
            recognition.stop(); // 音声認識を停止
            speak("確認できませんでした。もう一度お願いします。").then(() => {
                startGuide(); // 同じステップを再度開始
            });
        }, 15000); // 15秒待機
    } else {
        document.getElementById("guide-text").textContent = "全てのステップが完了しました。お疲れ様でした。";
        await speak("全てのステップが完了しました。お疲れ様でした。");
        recognition.stop(); // 音声認識を停止
        isGuideCompleted = true; // ガイドが完了したことを記録
        resetGuide(); // 初期状態に戻す
    }
}

// 音声認識イベント設定
recognition.onresult = (event) => {
    clearTimeout(recognitionTimeout); // タイムアウトをクリア
    const transcript = event.results[0][0].transcript;
    console.log("認識されたテキスト:", transcript); // 認識されたテキストをコンソールに表示
    if (transcript.includes("できた") || transcript.includes("done") || transcript.includes("完成") || transcript.includes("완료")) {
        currentStep++;
        updateProgress();
        isRecognitionActive = false; // 音声認識を非アクティブにする
        startGuide(); // 次のステップへ
    } else {
        speak("確認できませんでした。もう一度お願いします。").then(() => {
            isRecognitionActive = false; // 音声認識を非アクティブにする
            startGuide(); // 同じステップを再度開始
        });
    }
};

// 音声認識が終了したときのイベント設定
recognition.onend = () => {
    // ガイドが完了していない場合のみ音声認識を再開
    if (!isGuideCompleted && isRecognitionActive) {
        setTimeout(() => {
            isRecognitionActive = true; // 音声認識をアクティブにする
            recognition.start(); // 再度音声認識を開始
        }, 15000); // 15秒後に再度音声認識開始
    }
};

// 進捗バー更新
function updateProgress() {
    const progressValue = (currentStep / steps[selectedLanguage].length) * 100;
    document.getElementById("progress-bar").value = progressValue;
}

// ガイドのリセット（言語切替用）
function resetGuide() {
    currentStep = 0;
    document.getElementById("progress-bar").value = 0;
    document.getElementById("guide-text").textContent = "案内はここに表示されます";
}

// アラート表示とガイド開始
document.getElementById("start-button").addEventListener("click", () => {
    selectedLanguage = document.getElementById("language-select").value; // 選択した言語を取得
    if (confirm("ガイドを開始しますか？")) {
        isGuideCompleted = false; // ガイド開始時にフラグをリセット
        startGuide();
    }
});

// 音声リストを読み込む
loadVoices();
// 音声が利用可能になるまでのイベント
speechSynthesis.onvoiceschanged = loadVoices;
