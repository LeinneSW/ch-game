const QUIZ_KEY = 'quizzes';
const CHANNEL_ID_KEY = 'channelId'

export function loadQuizzes(){
    try{
        return JSON.parse(localStorage.getItem(QUIZ_KEY) || '[]');
    }catch{
        saveQuizzes([]);
        return [];
    }
}
export function saveQuizzes(topics){
    localStorage.setItem(QUIZ_KEY, JSON.stringify(topics));
}

export const getChannelId = () => {
    const channelId = sessionStorage.getItem(CHANNEL_ID_KEY) || '';
    if(channelId.length === 32){
        return channelId;
    }
    sessionStorage.removeItem(CHANNEL_ID_KEY);
    return ''
}

export const setChannelId = (channelId) => {
    if(channelId.length === 32){
        sessionStorage.setItem(CHANNEL_ID_KEY, channelId);
        return true
    }
    return false
}

export const shuffle = (result) => { // 피셔–예이츠
    for(let i = result.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
}