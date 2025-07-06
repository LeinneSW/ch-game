import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"
import {loadQuizzes, saveQuizzes, getChannelId, setChannelId, shuffle, resetChannelId} from '../../util/util.js';
import {resetScores, setGameState} from "../../game/js/data.js";
import {createModal} from "../../util/modal.js";

function render(){
    const list = document.getElementById('topic-list');
    list.innerHTML = '';
    const quizzes = loadQuizzes();
    if(!quizzes.length){
        list.innerHTML = '<p>추가된 주제가 없습니다.</p>';
        return;
    }
    quizzes.forEach((quiz, index) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
            <button class="del-btn" title="삭제">✕</button>
            <h2>${quiz.topic}</h2>
            <p>${quiz.description}</p>`;
        card.onclick = () => {
            /**
             * Quiz: {topic: string, description: string, items: QuizItem[]}
             * QuizItem: {word: string, aliases: string[], hints: string[]}
             */
            const copyQuiz = {...quiz}
            shuffle(copyQuiz.items)
            copyQuiz.items.forEach((item) => !Array.isArray(item.aliases) && (item.aliases = []))
            const gameState = {
                round: 0,
                roundLength: copyQuiz.items.length - 1, // TODO: 라운드 개수 조절 기능
                solved: false,
                quiz: copyQuiz,
            };
            setGameState(gameState);
            resetScores()
            location.href = '/game/';
        };
        list.appendChild(card);
        card.querySelector('.del-btn').onclick = (e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 막기
            if(confirm(`선택된 주제 '${quiz.topic}'을(를) 제거하시겠습니까?`)){
                quizzes.splice(index, 1);
                saveQuizzes(quizzes);
                render();
            }
        };
    });
}

window.addEventListener('load', async () => {
    const client = new ChzzkClient({
        baseUrls: {
            chzzkBaseUrl: "/cors/chzzk",
            gameBaseUrl: "/cors/game"
        }
    });

    let channelId = getChannelId()
    if(channelId.length !== 32){
        channelId = await createModal('prompt', '본인의 치지직 닉네임 혹은 채널 ID를 입력해주세요')
    }
    let liveDetail;
    try{
        channelId.length === 32 && (liveDetail = await client.live.detail(channelId));
    }catch(e){}
    if(liveDetail == null || typeof liveDetail !== 'object'){
        const channelList = await client.search.channels(channelId); // 닉네임으로 판단하여 채널 검색 수행
        const channel = channelList.channels.find(channel => channel.channelName === channelId); // '정확히'일치하는 닉네임 탐색
        if(!channel){
            resetChannelId()
            await createModal('alert', '잘못된 닉네임 혹은 방송한 이력이 없어 접속에 실패했습니다.')
            setTimeout(() => location.reload(), 500);
            return
        }
        setChannelId(channel.channelId)
    }else if(liveDetail.chatChannelId == null){
        await createModal('alert', '현재 방송이 19세로 설정되어있습니다.\n19세 해제 후 이용 부탁드립니다. (19세 설정시 채팅 조회 불가)')
    }
    render();

    const file = document.getElementById('file-input');
    file.addEventListener('change', async (e) => {
        const quizzes = loadQuizzes();
        for(const file of e.target.files){
            try{
                const txt = await file.text()
                const {topic, description, items} = JSON.parse(txt);
                if(typeof topic !== 'string' || typeof description !== 'string' || !Array.isArray(items)){
                    await createModal('alert', `데이터 구조가 잘못되었습니다. '${file.name}'\n올바른 구조: {topic: str, description: str, items: QuizItem[]}`)
                    continue;
                }
                let valid = true
                for(const {word, hints} of items){
                    if(typeof word !== 'string' || !Array.isArray(hints)){
                        valid = false
                        await createModal('alert', `단어 정의가 잘못되었습니다. '${file.name}'\n올바른 구조: [{word: string, hints: string[]}, ...]`)
                        break
                    }
                }
                valid && quizzes.push({topic, description, items});
            }catch(e){
                await createModal('alert', `잘못된 파일: '${file.name}'\n올바른 JSON 파일이 아닙니다.`);
            }
        }
        saveQuizzes(quizzes);
        render();
    });
})