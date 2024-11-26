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

function formatCurrencyInput(input) {
    input.value = input.value
        .replace(/[^0-9]/g, '') // 숫자 외 문자 제거
        .replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 콤마 추가
}

window.onload = function () {
    const cashAmountInput = document.getElementById('cashAmount');
    if (cashAmountInput) {
        cashAmountInput.addEventListener('input', function () {
            formatCurrencyInput(cashAmountInput);
        });
    }
};

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('currency')) {
        formatCurrencyInput(e.target);
    }
}

// 가산세 계산
function calculateLatePenalty(submissionDate, giftDate, giftTax) {
    const giftDateObj = new Date(giftDate);
    const submissionDateObj = new Date(submissionDate);

    if (!giftDate || !submissionDate || isNaN(giftDateObj) || isNaN(submissionDateObj)) {
        return 0; // 날짜가 없거나 잘못된 경우 가산세 없음
    }

    const dueDate = new Date(giftDateObj);
    dueDate.setMonth(dueDate.getMonth() + 3);

    if (submissionDateObj <= dueDate) {
        return 0; // 신고 기한 내
    }

    const extendedDueDate = new Date(giftDateObj);
    extendedDueDate.setMonth(extendedDueDate.getMonth() + 6);

    if (submissionDateObj <= extendedDueDate) {
        return giftTax * 0.1; // 3개월 초과 ~ 6개월 이내
    }

    return giftTax * 0.2; // 6개월 초과
}

// 증여세 계산 로직 (수정된 함수)
function calculateGiftTax(taxableAmount) {
    let tax = 0;
    for (let i = 0; i < taxBrackets.length; i++) {
        const bracket = taxBrackets[i];
        const prevLimit = taxBrackets[i - 1]?.limit || 0;

        if (taxableAmount > bracket.limit) {
            tax += (bracket.limit - prevLimit) * (bracket.rate / 100);
        } else {
            tax += (taxableAmount - prevLimit) * (bracket.rate / 100);
            tax -= bracket.deduction; // 누진 공제 적용
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
            <input type="text" id="cashAmount" class="currency" placeholder="예: 10,000,000">
        `;
        const cashAmountInput = document.getElementById('cashAmount');
        cashAmountInput.addEventListener('input', function () {
            formatCurrencyInput(cashAmountInput);
        });
    } else if (selectedType === 'realEstate') {
        additionalFields.innerHTML = `
            <label for="realEstateValue">부동산 공시가격 (원):</label>
            <input type="text" id="realEstateValue" class="currency" placeholder="예: 500,000,000">
        `;
    } else if (selectedType === 'stock') {
        additionalFields.innerHTML = `
            <label for="stockQuantity">주식 수량:</label>
            <input type="number" id="stockQuantity" placeholder="예: 100">
            <label for="stockPrice">증여일 기준 주가 (원):</label>
            <input type="text" id="stockPrice" class="currency" placeholder="예: 50,000">
        `;
    }
});

// 결과 출력
document.getElementById('taxForm').onsubmit = function (e) {
    e.preventDefault();

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

    const previousGiftInputs = document.getElementById('previousGifts').querySelectorAll('input');
    let previousGiftTotal = 0;
    previousGiftInputs.forEach(input => {
        const value = parseCurrency(input.value || '0');
        if (!isNaN(value)) {
            previousGiftTotal += value;
        }
    });

    const exemptionLimit = 50000000; // 기본 공제
    const taxableAmount = Math.max(giftAmount - exemptionLimit - previousGiftTotal, 0);

    const giftTax = calculateGiftTax(taxableAmount);

    const giftDate = document.getElementById('giftDate')?.value;
    const submissionDate = document.getElementById('submissionDate')?.value;
    const latePenalty = calculateLatePenalty(submissionDate, giftDate, giftTax);

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>증여세:</strong> ${giftTax.toLocaleString()}원</p>
        <p><strong>가산세:</strong>
