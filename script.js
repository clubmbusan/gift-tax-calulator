function parseCurrency(value) {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
}

// 증여세 누진세 계산 로직
const taxBrackets = [
    { limit: 100000000, rate: 10, deduction: 0 },
    { limit: 500000000, rate: 20, deduction: 10000000 },
    { limit: 1000000000, rate: 30, deduction: 60000000 },
    { limit: 3000000000, rate: 40, deduction: 160000000 },
    { limit: Infinity, rate: 50, deduction: 460000000 }
];

// 금액 입력 시 콤마 처리
document.addEventListener('input', function (e) {
    if (['cashAmount', 'realEstateValue', 'stockPrice'].includes(e.target.id) || e.target.name === 'pastGiftAmount') {
        e.target.value = e.target.value
            .replace(/[^0-9]/g, '') // 숫자 외 문자 제거
            .replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 콤마 추가
    }
});

// 과거 증여 내역 총합 계산 함수
function calculatePreviousGifts() {
    const previousGiftEntries = document.querySelectorAll('#previousGiftsContainer .gift-entry');
    let total = 0;

    previousGiftEntries.forEach(entry => {
        const amount = parseCurrency(entry.querySelector('input[name="pastGiftAmount"]').value || '0');
        if (!isNaN(amount)) total += amount;
    });

    return total;
}

// 가산세 계산 함수
function calculateLatePenalty(submissionDate, giftDate, giftTax) {
    if (!giftDate || !submissionDate) return 0;

    const giftDateObj = new Date(giftDate);
    const submissionDateObj = new Date(submissionDate);
    const dueDate = new Date(giftDateObj);
    dueDate.setMonth(dueDate.getMonth() + 3); // 신고 기한 3개월 추가

    if (submissionDateObj <= dueDate) return 0;

    const extendedDueDate = new Date(giftDateObj);
    extendedDueDate.setMonth(extendedDueDate.getMonth() + 6);

    if (submissionDateObj <= extendedDueDate) return giftTax * 0.1; // 3개월 초과 ~ 6개월 이내: 10%
    return giftTax * 0.2; // 6개월 초과: 20%
}

// 증여세 계산 로직
function calculateGiftTax(taxableAmount) {
    let tax = 0;

    for (let i = 0; i < taxBrackets.length; i++) {
        const bracket = taxBrackets[i];
        const prevLimit = taxBrackets[i - 1]?.limit || 0;

        if (taxableAmount > bracket.limit) {
            tax += (bracket.limit - prevLimit) * (bracket.rate / 100);
        } else {
            tax += (taxableAmount - prevLimit) * (bracket.rate / 100);
            tax -= bracket.deduction;
            break;
        }
    }

    return Math.max(tax, 0);
}

// 폼 제출 이벤트
document.getElementById('taxForm').onsubmit = function (e) {
    e.preventDefault(); // 폼 기본 제출 동작 방지

    // 재산 유형별 금액 계산
    const selectedType = document.getElementById('assetType').value;
    let giftAmount = 0;

    if (selectedType === 'cash') {
        const cashInput = document.getElementById('cashAmount');
        giftAmount = parseCurrency(cashInput?.value || '0'); // 현금 입력값 처리
    } else if (selectedType === 'realEstate') {
        const realEstateInput = document.getElementById('realEstateValue');
        giftAmount = parseCurrency(realEstateInput?.value || '0'); // 부동산 입력값 처리
    } else if (selectedType === 'stock') {
        const stockQuantity = parseInt(document.getElementById('stockQuantity')?.value || '0', 10);
        const stockPrice = parseCurrency(document.getElementById('stockPrice')?.value || '0');
        giftAmount = stockQuantity * stockPrice; // 주식 입력값 계산
    }

    // 과거 증여 내역 합산
    const previousGiftTotal = calculatePreviousGifts(); // 과거 증여 내역 금액 합산

    // 공제 한도
    const exemptionLimit = 50000000; // 기본 공제 한도

    // 과세 표준 및 증여세 계산
    const taxableAmount = Math.max(giftAmount - exemptionLimit - previousGiftTotal, 0);
    const giftTax = calculateGiftTax(taxableAmount);

    // 가산세 계산
    const giftDate = document.getElementById('giftDate')?.value;
    const submissionDate = document.getElementById('submissionDate')?.value;
    const latePenalty = calculateLatePenalty(submissionDate, giftDate, giftTax);

    // 결과 출력
    document.getElementById('result').innerHTML = `
        <p><strong>증여세:</strong> ${giftTax.toLocaleString()}원</p>
        <p><strong>가산세:</strong> ${latePenalty.toLocaleString()}원</p>
        <p><strong>최종 납부세액:</strong> ${(giftTax + latePenalty).toLocaleString()}원</p>
    `;
};

// 재산 유형 변경 시 입력 필드 동적 생성
document.getElementById('assetType').addEventListener('change', function () {
    const additionalFields = document.getElementById('additionalFields');
    additionalFields.innerHTML = ''; // 기존 필드 초기화

    if (this.value === 'cash') {
        additionalFields.innerHTML = `
            <label for="cashAmount">현금 금액 (원):</label>
            <input type="text" id="cashAmount" placeholder="예: 10,000,000">
        `;
    } else if (this.value === 'realEstate') {
        additionalFields.innerHTML = `
            <label for="realEstateValue">부동산 공시가격 (원):</label>
            <input type="text" id="realEstateValue" placeholder="예: 500,000,000">
        `;
    } else if (this.value === 'stock') {
        additionalFields.innerHTML = `
            <label for="stockQuantity">주식 수량:</label>
            <input type="number" id="stockQuantity" placeholder="예: 100">
            <label for="stockPrice">증여일 기준 주가 (원):</label>
            <input type="text" id="stockPrice" placeholder="예: 50,000">
        `;
    }
}); // 닫는 괄호를 정확히 추가!
