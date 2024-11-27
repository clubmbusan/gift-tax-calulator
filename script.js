// 증여세 누진세 계산 로직
const taxBrackets = [
    { limit: 100000000, rate: 10, deduction: 0 },
    { limit: 500000000, rate: 20, deduction: 10000000 },
    { limit: 1000000000, rate: 30, deduction: 60000000 },
    { limit: 3000000000, rate: 40, deduction: 160000000 },
    { limit: Infinity, rate: 50, deduction: 460000000 }
];

// 금액 입력 시 콤마 처리
function parseCurrency(value) {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
}

document.addEventListener('input', function (e) {
    if (e.target.id === 'cashAmount' || e.target.id === 'realEstateValue' || e.target.id === 'stockPrice') {
        e.target.value = e.target.value
            .replace(/[^0-9]/g, '') // 숫자 외 문자 제거
            .replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 콤마 추가
    }
});

// 가산세 계산 (수정된 함수)
function calculateLatePenalty(submissionDate, giftDate, giftTax) {
    const giftDateObj = new Date(giftDate);
    const submissionDateObj = new Date(submissionDate);

    if (!giftDate || !submissionDate || isNaN(giftDateObj) || isNaN(submissionDateObj)) {
        return 0; // 날짜가 없거나 잘못된 경우 가산세 없음
    }

    // 신고 기한 계산 (증여일 + 3개월)
    const dueDate = new Date(giftDateObj);
    dueDate.setMonth(dueDate.getMonth() + 3); // 3개월 추가

    // 날짜 비교
    if (submissionDateObj <= dueDate) {
        return 0; // 신고 기한 내 가산세 없음
    }

    // 연장된 신고 기한 (증여일 + 6개월)
    const extendedDueDate = new Date(giftDateObj);
    extendedDueDate.setMonth(extendedDueDate.getMonth() + 6);

    if (submissionDateObj <= extendedDueDate) {
        return giftTax * 0.1; // 3개월 초과 ~ 6개월 이내: 가산세 10%
    }

    return giftTax * 0.2; // 6개월 초과: 가산세 20%
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

// 재산 유형에 따라 입력 필드 표시
document.getElementById('assetType').addEventListener('change', function () {
    const selectedType = this.value;
    const additionalFields = document.getElementById('additionalFields');
    additionalFields.innerHTML = ''; // 기존 필드 초기화

    if (selectedType === 'cash') {
        additionalFields.innerHTML = `
            <label for="cashAmount">현금 금액 (원):</label>
            <input type="text" id="cashAmount" placeholder="예: 10,000,000">
        `;
    } else if (selectedType === 'realEstate') {
        additionalFields.innerHTML = `
            <label for="realEstateValue">부동산 공시가격 (원):</label>
            <input type="text" id="realEstateValue" placeholder="예: 500,000,000">
        `;
    } else if (selectedType === 'stock') {
        additionalFields.innerHTML = `
            <label for="stockQuantity">주식 수량:</label>
            <input type="number" id="stockQuantity" placeholder="예: 100">
            <label for="stockPrice">증여일 기준 주가 (원):</label>
            <input type="text" id="stockPrice" placeholder="예: 50,000">
        `;
    }
});

// "과거 증여 내역 추가" 버튼 클릭 시 동적 필드 추가
document.getElementById('addPreviousGift').addEventListener('click', function () {
    const container = document.getElementById('previousGiftsContainer');

    // 동적으로 추가할 새로운 증여 내역 필드
    const newGiftEntry = document.createElement('div');
    newGiftEntry.className = 'gift-entry';

    newGiftEntry.innerHTML = `
        <label>과거 증여 금액:</label>
        <input type="text" name="pastGiftAmount" placeholder="예: 10,000,000" required>

        <label>과거 증여일:</label>
        <input type="date" name="pastGiftDate" required>

        <button type="button" class="removeGiftButton">삭제</button>
    `;

    // "삭제" 버튼 이벤트 추가
    newGiftEntry.querySelector('.removeGiftButton').addEventListener('click', function () {
        container.removeChild(newGiftEntry);
    });

    // 새로운 필드를 컨테이너에 추가
    container.appendChild(newGiftEntry);
});


// 결과 출력
document.getElementById('taxForm').onsubmit = function (e) {
    e.preventDefault();

    // 재산 유형에 따른 금액 계산
    const selectedType = document.getElementById('assetType').value;
    let giftAmount = 0;

    if (selectedType === 'cash') {
        giftAmount = parseCurrency(document.getElementById('cashAmount')?.value || '0');
    } else if (selectedType === 'realEstate') {
        giftAmount = parseCurrency(document.getElementById('realEstateValue')?.value || '0');
    } else if (selectedType === 'stock') {
        const stockQuantity = parseInt(document.getElementById('stockQuantity')?.value || '0', 10);
        const stockPrice = parseCurrency(document.getElementById('stockPrice')?.value || '0');
        giftAmount = stockQuantity * stockPrice;
    }

    // 과거 증여 내역 합산 (금액 + 날짜)
const previousGiftEntries = document.querySelectorAll('#previousGiftsContainer .gift-entry');
let previousGiftTotal = 0;

previousGiftEntries.forEach(entry => {
    const giftAmount = parseCurrency(entry.querySelector('input[name="pastGiftAmount"]').value || '0');
    const giftDate = entry.querySelector('input[name="pastGiftDate"]').value;

    if (!isNaN(giftAmount)) {
        previousGiftTotal += giftAmount;

        // 날짜를 활용한 추가 계산 로직을 여기서 구현할 수 있음
        console.log(`과거 증여 금액: ${giftAmount}, 증여일: ${giftDate}`);
    }
});
// 기본 공제 한도 설정
const exemptionLimit = 50000000; // 기본 공제 한도

// 과세 표준 계산
const taxableAmount = Math.max(giftAmount - exemptionLimit - previousGiftTotal, 0);

// 증여세 계산
const giftTax = calculateGiftTax(taxableAmount);

// 가산세 계산
const giftDate = document.getElementById('giftDate')?.value;
const submissionDate = document.getElementById('submissionDate')?.value;
const latePenalty = calculateLatePenalty(submissionDate, giftDate, giftTax);

// 디버깅 로그 (중간값 확인)
console.log(`과세 표준: ${taxableAmount}`);
console.log(`증여세: ${giftTax}`);
console.log(`가산세: ${latePenalty}`);

// 결과 출력
const resultDiv = document.getElementById('result');
resultDiv.innerHTML = `
    <p><strong>증여세:</strong> ${giftTax.toLocaleString()}원</p>
    <p><strong>가산세:</strong> ${latePenalty.toLocaleString()}원</p>
    <p><strong>최종 납부세액:</strong> ${(giftTax + latePenalty).toLocaleString()}원</p>
`;
    
};
