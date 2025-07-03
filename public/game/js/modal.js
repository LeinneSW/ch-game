export const showAlertModal = (title, message) => {
    const overlay = document.getElementById('overlay');
    overlay.querySelector('.modal-title').textContent = title || '';
    overlay.querySelector('.modal-body').innerHTML = (message || '').replace(/\n/g, '<br>');

    const footer = document.querySelector('.modal-footer')
    footer.innerHTML = `<button id="confirmBtn" class="modal-button primary">확인</button>`

    document.getElementById('cancelBtn').onclick = closeModal;

    // 애니메이션 클래스 토글
    overlay.classList.remove('leaving');
    requestAnimationFrame(() => overlay.classList.add('active'));
};

export const showConfirmModal = (title, message, confirmFn, cancelFn) => {
    const overlay = document.getElementById('overlay');
    overlay.querySelector('.modal-title').textContent = title || '';
    overlay.querySelector('.modal-body').innerHTML = (message || '').replace(/\n/g, '<br>');

    const footer = document.querySelector('.modal-footer')
    footer.innerHTML = `<button id="confirmBtn" class="modal-button primary">확인</button>
        <button id="cancelBtn" class="modal-button ghost">취소</button>`

    const cancelBtn = document.getElementById('cancelBtn')
    cancelBtn.onclick = cancelFn
    cancelBtn.addEventListener('click', closeModal);
    document.getElementById('confirmBtn').onclick = confirmFn

    // 애니메이션 클래스 토글
    overlay.classList.remove('leaving');
    requestAnimationFrame(() => overlay.classList.add('active'));
};

export const closeModal = () => {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('active');
    overlay.classList.add('leaving');
};

window.addEventListener('load', async () => {
    const overlay = document.getElementById('overlay');
    const closeBtn = overlay.querySelector('.close-btn');
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => e.target === overlay && closeModal()); // 외부 클릭시 닫기
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal()); // esc 입력시 닫기
})