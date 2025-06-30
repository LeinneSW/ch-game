const KOR_BASE = 0xac00;
const CHOSUNG_LIST = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
    'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const LS_KEY = 'quizzes';

export function toChosung(str){
    return [...str].map(ch => {
        const code = ch.charCodeAt(0) - KOR_BASE;
        if(code < 0 || code > 11171) return ch;
        return CHOSUNG_LIST[Math.floor(code / 588)];
    });
}

export function loadQuizzes(){
    try{
        return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    }catch{
        saveQuizzes([]);
        return [];
    }
}
export function saveQuizzes(topics){
    localStorage.setItem(LS_KEY, JSON.stringify(topics));
}

export function setSessionData(key, value){
    sessionStorage.setItem(key, JSON.stringify(value));
}

export function getSessionData(key){
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : null;
}