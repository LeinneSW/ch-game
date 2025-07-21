const KOR_BASE = 0xac00;
const CHOSUNG_LIST = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
    'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];
const nicknameColors = [
    "#EEA05D", "#EAA35F", "#E98158", "#E97F58",
    "#E76D53", "#E66D5F", "#E16490", "#E481AE",
    "#E481AE", "#D25FAC", "#D263AE", "#D66CB4",
    "#D071B6", "#AF71B5", "#A96BB2", "#905FAA",
    "#B38BC2", "#9D78B8", "#8D7AB8", "#7F68AE",
    "#9F99C8", "#717DC6", "#7E8BC2", "#5A90C0",
    "#628DCC", "#81A1CA", "#ADD2DE", "#83C5D6",
    "#8BC8CB", "#91CBC6", "#83C3BB", "#7DBFB2",
    "#AAD6C2", "#84C194", "#92C896", "#94C994",
    "#9FCE8E", "#A6D293", "#ABD373", "#BFDE73"
]

const tier2ColorList = {};
const cheatKeyColorList = {};

export function toChosung(str){
    return [...str].map(ch => {
        const code = ch.charCodeAt(0) - KOR_BASE;
        if(code < 0 || code > 11171) return ch;
        return CHOSUNG_LIST[Math.floor(code / 588)];
    });
}

const getUserColor = (seed) => {
    const index = seed.split("")
        .map((c) => c.charCodeAt(0))
        .reduce((a, b) => a + b, 0) % nicknameColors.length
    return nicknameColors[index]
}

const htmlEntity = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
}
export const escapeHTML = (s) => {
    return s.replace(/[&<>"']/g, m => htmlEntity[m]);
}

export const updateSteamerInfo = async (channel) => {
    const nickname = document.getElementById('streamer-name');
    const avatar = document.getElementById('streamer-avatar');
    const defaultURL = avatar.src;
    avatar.src = channel.channelImageUrl || defaultURL;
    avatar.onerror = () => avatar.src = defaultURL;
    nickname.textContent = channel.channelName;
}

/**
 * @param {Object} profile
 * @param {string} message
 * @param {number} msecs
 * @param {Record<string, unknown> | string} colorData
 * @param {Object} emojiList
 */
export const addMessage = (profile, message, msecs = Date.now(), colorData = 'white', emojiList = {}) => {
    const messageList = document.getElementById('message-list');
    const messageDiv = document.createElement('div')
    messageDiv.id = msecs + ''
    messageDiv.dataset.userIdHash = profile.userIdHash
    messageDiv.className = 'message'
    messageList.appendChild(messageDiv)

    const nickSpan = document.createElement('span')
    nickSpan.className = 'message-nickname'
    nickSpan.textContent = profile.nickname
    if(typeof colorData === 'string'){
        nickSpan.style.color = colorData
    }else{
        switch(colorData.effectType){
            case 'GRADATION':
                const direction = colorData.effectValue.direction.toLowerCase();
                const startColor = colorData.lightRgbValue;
                const endColor = colorData.effectValue.lightRgbEndValue;
                nickSpan.style.backgroundImage = `linear-gradient(to ${direction}, ${startColor}, ${endColor})`;
                nickSpan.style.backgroundClip = 'text';
                nickSpan.style.webkitBackgroundClip = 'text';
                nickSpan.style.color = 'transparent';
                break;
            case 'HIGHLIGHT':
                nickSpan.style.color = colorData.lightRgbValue;
                nickSpan.style.backgroundColor = colorData.effectValue.lightRgbBackgroundValue;
                break;
            case 'STEALTH':
                nickSpan.style.color = 'transparent';
                break;
        }
    }
    messageDiv.appendChild(nickSpan)

    const textSpan = document.createElement('span')
    textSpan.className = 'message-text'

    message = escapeHTML(message)
    for(const emojiName in emojiList){
        message = message.replaceAll(`{:${emojiName}:}`, `<img class='message-emoji' src='${emojiList[emojiName]}' alt="emoji">`)
    }
    textSpan.innerHTML = ` : ${message}`
    messageDiv.appendChild(textSpan)

    const threshold = 10; // 오차 허용값 (px)
    if(messageList.scrollHeight - (messageList.scrollTop + messageList.clientHeight + messageDiv.clientHeight) <= threshold){
        messageList.scrollTop = messageList.scrollHeight;
    }
}

export const clearMessageList = () => {
    const messageList = document.getElementById('message-list');
    messageList.innerHTML = '';
}

export const convertColorCode = (colorCode, userId, chatChannelId) => {
    if(colorCode.startsWith('CC')){
        return cheatKeyColorList[colorCode] || getUserColor(userId + chatChannelId);
    }
    return tier2ColorList[colorCode];
}

/**
 * @param {GameState} gameState
 */
export const updateQuiz = (gameState) => {
    const topicTitle = document.getElementById('topic-title');
    topicTitle.textContent = gameState.quiz.topic;

    const currentWord = gameState.quiz.items[gameState.round].word;
    const currentHints = gameState.quiz.items[gameState.round].hints;

    // UI 초기화
    const $roundInfo = document.getElementById('round-info');
    $roundInfo.textContent = `라운드 ${gameState.round + 1}`;

    const $answerLabel = document.getElementById('answer-label');
    $answerLabel.innerText = currentWord;

    const hintBox = document.getElementById('hint-list');
    hintBox.innerHTML = ''; // 기존 힌트 초기화
    currentHints.forEach(h => {
        const li = document.createElement('li');
        li.textContent = h;
        hintBox.appendChild(li);
    });

    const nextBtn = document.getElementById('next-btn');
    nextBtn.hidden = !gameState.solved;

    const csListElement = document.getElementById('chosung-list');
    csListElement.innerHTML = ''; // 기존 단어 초기화
    toChosung(currentWord).forEach((cho, index) => {
        const li = document.createElement('li');
        li.className = 'chosung-item'
        li.dataset.char = currentWord[index];
        li.textContent = li.dataset.cho = cho;
        csListElement.appendChild(li);
    });
    return csListElement.querySelectorAll('li')
}

window.addEventListener('load', async () => {
    /** @var {Record<string, unknown>[]} colorCodes */
    const colorCodes = await (await fetch('/colorCodes')).json();
    for(const index in colorCodes){
        const colorData = colorCodes[index];
        switch(colorData.availableScope){
            case 'CHEATKEY':
                cheatKeyColorList[colorData.code] = colorData.lightRgbValue;
                break;
            case 'SUBSCRIPTION_TIER2':
                tier2ColorList[colorData.code] = colorData;
                break;
        }
    }
})