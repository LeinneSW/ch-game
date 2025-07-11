const createLeaderboardItem = (profile) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'leaderboard-item new-item';
    itemElement.id = profile.userIdHash;

    // 배경 그래프를 위한 요소 추가
    const scoreBackground = document.createElement('div');
    scoreBackground.className = 'score-background';
    itemElement.appendChild(scoreBackground);

    // 콘텐츠 컨테이너 (순위, 프로필, 이름, 점수 포함)
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';

    // 순위 표시
    const rankNumber = document.createElement('div');
    rankNumber.className = 'rank-number';

    // 프로필 이미지
    const profileImg = document.createElement('div');
    profileImg.className = 'profile-image';
    profileImg.style.backgroundImage = `url(${profile.profileImageUrl || '/assets/images/default-profile.png'})`;

    // 사용자 정보 (닉네임)
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.textContent = profile.nickname;

    // 점수 텍스트
    const scoreText = document.createElement('div');
    scoreText.className = 'score-text';

    // 요소들을 컨텐츠 컨테이너에 추가
    contentContainer.appendChild(rankNumber);
    contentContainer.appendChild(profileImg);
    contentContainer.appendChild(userInfo);
    contentContainer.appendChild(scoreText);

    // 컨텐츠 컨테이너를 아이템에 추가
    itemElement.appendChild(contentContainer);

    // 컨테이너에 항목 추가
    const itemsContainer = document.querySelector('.leaderboard-items-container');
    itemsContainer.appendChild(itemElement);
    return itemElement;
}

export function updateRankGraph(scores){
    // 점수 데이터를 배열로 변환하고 점수별로 정렬
    const sortedUsers = Object.values(scores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    // 순위 컨테이너 요소 가져오기
    const itemsContainer = document.querySelector('.leaderboard-items-container');

    // 최대 점수를 기준으로 바 길이 계산
    const maxScore = sortedUsers[0]?.score || 100;

    // 각 참가자마다 요소 생성 또는 업데이트
    const calc = (rank) => `calc(${rank * 100}% + ${rank * 6}px)`
    sortedUsers.forEach((user, index) => {
        let itemElement = document.getElementById(user.profile.userIdHash);
        if(itemElement){
            // 위치 업데이트를 위한 설정
            itemElement.style.transform = `translateY(${calc(index)})`;
        }else{
            itemElement = createLeaderboardItem(user.profile)
            itemElement.style.setProperty('--y-pos', calc(index));
            setTimeout(() => {
                itemElement.classList.remove('new-item');
                itemElement.style.transform = `translateY(${calc(+itemElement.dataset.rank)})`;
            }, 300);

        }
        itemElement.dataset.rank = index + '';
        itemElement.style.zIndex = 10 - index + ''; // 높은 순위가 위에 오도록

        // 순위 업데이트
        const rankNumber = itemElement.querySelector('.rank-number');
        rankNumber.textContent = index + 1 + '';

        // 메달 클래스 업데이트
        let className = 'rank-number'
        if(index === 0) className += ' gold';
        else if(index === 1) className += ' silver';
        else if(index === 2) className += ' bronze';
        rankNumber.className = className;

        // 점수 업데이트
        const scoreText = itemElement.querySelector('.score-text');
        scoreText.textContent = user.score;

        // 점수 바 길이 업데이트
        const scoreBackground = itemElement.querySelector('.score-background');
        scoreBackground.style.width = `${(user.score / maxScore) * 100}%`;
    });

    // 더 이상 리더보드에 없는 사용자 항목 제거
    const existingItems = itemsContainer.querySelectorAll('.leaderboard-item');
    existingItems.forEach(item => {
        if(+item.dataset.rank >= 10){
            item.style.opacity = 0 + '';
            setTimeout(() => item.remove(), 500);
        }
    });
}

const testCode = (scores) => {
    const index = Object.keys(scores).length + 1;
    const userIdHash = `user${Math.floor(Math.random() * 100000)}`;
    scores[userIdHash] = {
        profile: {
            userIdHash,
            nickname: `유저 ${index}`,
            profileImageUrl: `https://picsum.photos/200/300?random=${index}`
        },
        score: Math.floor(Math.random() * 20) * 100 + 100
    }
}

window.addEventListener('load', () => {
    // TEST CODE
    const scores = {};
    /*for(let i = 1; i < 11; i++){
        testCode(scores);
    }*/
    setInterval(() => {
        const keys = Object.keys(scores);
        if(keys.length >= 5){
            scores[keys[Math.floor(Math.random() * keys.length)]].score += Math.floor(Math.random() * 3) * 100 + 100;
        }else{
            testCode(scores);
        }
        updateRankGraph(scores)
    }, 1000);
})