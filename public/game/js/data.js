const SCORE_KEY = 'scores'
const GAME_STATE_KEY = 'gameState'

export const getGameState = () => {
    try{
        return JSON.parse(sessionStorage.getItem(GAME_STATE_KEY));
    }catch{}
    sessionStorage.removeItem(GAME_STATE_KEY)
}

export const setGameState = (state) => {
    sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
}

export const getScores = () => {
    try{
        return JSON.parse(sessionStorage.getItem(SCORE_KEY));
    }catch{}
    setScores({});
    return {}
}

export const setScores = (scores) => {
    sessionStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}