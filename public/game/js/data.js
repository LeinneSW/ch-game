import {shuffle} from "../../util/util.js";

const SCORE_KEY = 'scores'
const GAME_STATE_KEY = 'gameState'

let cachedScores = {};
let cachedGameState = null;

export const getGameState = () => {
    if(cachedGameState) return cachedGameState;
    try{
        cachedGameState = JSON.parse(sessionStorage.getItem(GAME_STATE_KEY));
        return cachedGameState
    }catch{}
    resetGameState();
    return null;
}

export const setGameState = (newState) => {
    cachedGameState = newState;
    sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
}

export const saveGameState = () => {
    if(!cachedGameState) return;
    sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(cachedGameState));
}

export const resetGameState = () => {
    cachedGameState = null
    sessionStorage.removeItem(GAME_STATE_KEY);
}

export const restartGame = () => {
    if(!cachedGameState) return;
    cachedGameState.round = 0
    cachedGameState.solved = false
    shuffle(cachedGameState.quiz.items)
    resetScores()
    saveGameState()
}

export const getScores = () => {
    if(cachedScores) return cachedScores;
    try{
        cachedScores = JSON.parse(sessionStorage.getItem(SCORE_KEY));
        return cachedScores
    }catch{}
    resetScores();
    return {}
}

export const saveScores = () => {
    if(!cachedScores) return;
    sessionStorage.setItem(SCORE_KEY, JSON.stringify(cachedScores))
}

export const resetScores = () => {
    cachedScores = {}
    sessionStorage.setItem(SCORE_KEY, '{}')
}