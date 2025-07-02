import {shuffle} from "../../util/util.js";

const SCORE_KEY = 'scores'
const GAME_STATE_KEY = 'gameState'

export const getGameState = () => {
    try{
        return JSON.parse(sessionStorage.getItem(GAME_STATE_KEY));
    }catch{}
    resetGameState();
}

export const setGameState = (state) => {
    sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
}

export const resetGameState = () => {
    sessionStorage.removeItem(GAME_STATE_KEY);
}

export const restartGame = (state) => {
    state ??= getGameState()
    state.round = 0;
    state.solved = false;
    shuffle(state.quiz.items)
    setScores({})
}

export const getScores = () => {
    try{
        return JSON.parse(sessionStorage.getItem(SCORE_KEY));
    }catch{}
    resetScores();
    return {}
}

export const setScores = (scores) => {
    sessionStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}
export const resetScores = () => {
    sessionStorage.setItem(SCORE_KEY, '{}');
}