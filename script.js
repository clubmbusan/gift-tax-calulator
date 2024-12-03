// 증여세 누진세 계산 로직
const taxBrackets = [
    { limit: 100000000, rate: 10, deduction: 0 },
    { limit: 500000000, rate: 20, deduction: 10000000 },
    { limit: 1000000000, rate: 30, deduction: 60000000 },
    { limit: 3000000000, rate: 40, deduction: 160000000 },
    { limit: Infinity, rate: 50, deduction: 460000000 }
];

// 관계별 공제 한도 정의
const exemptionLimits = {
    child: 50000000,        // 성년 자녀
    minorChild: 20000000,   // 미성년 자녀
    spouse: 600000000,      // 배우자
    inLaw: 50000000,        // 사위/며느리
    other: 10000000         // 기타 타인
};

// 금액 입력 시 콤마 처리
function parseCurrency(value) {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
}

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('amount-input')) {
        e.target.value = e.target.value
            .replace(/[^0-9]/g, '') // 숫자 외 문자 제거
            .replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 콤마 추가
    }
});

// 증여세 계산 로직 (누진세율 적용)
function calculateGiftTax(taxableAmount) {
    let tax = 0;
    let previousLimit = 0;

    for (const bracket of taxBrackets) {
        if (taxableAmount > bracket.limit) {
            tax += (bracket.limit - previousLimit) * (bracket.rate / 100);
            previousLimit = bracket.limit;
        } else {
            tax += (taxableAmount - previousLimit) * (bracket.rate / 100);
            break;
        }
    }
    return Math.max(tax, 0); // 세금이 음수로 나오지 않도록 0 이상으로 처리
}

// 가산세 계산
function calculateLatePenalty(submissionDate, giftDate, giftTax) {
    const giftDateObj = new Date(giftDate);
    const submissionDateObj = new Date(submissionDate);

    if (!giftDate || !submissionDate || isNaN(giftDateObj) || isNaN(submissionDateObj)) {
        return 0;
    }

    const dueDate = new Date(giftDateObj);
    dueDate.setMonth(dueDate.getMonth() + 3);

    if (submissionDateObj <= dueDate) {
        return 0; // 신고 기한 내 가산세 없음
    }

    const extendedDueDate = new Date(giftDateObj);
    extendedDueDate.setMonth(extendedDueDate.getMonth() + 6);

    if (submissionDateObj <= extendedDueDate) {
        return giftTax * 0.1; // 3개월 초과 ~ 6개월 이내: 가산세 10%
    }

    return giftTax * 0.2; // 6개월 초과: 가산세 20%
}

// 과거 증여 금액 추가 버튼
document.getElementById('addGiftButton').addEventListener('click', function () {
    const container = document.getElementById('previousGifts');
    const newGiftEntry = document.createElement('div');
    newGiftEntry.style.marginBottom = '10px';
    newGiftEntry.innerHTML = `
        <input type="text" class="amount-input" placeholder="금액 입력 (원)">
        <button type="button" class="removeGiftButton">삭제</button>
    `;

    newGiftEntry.querySelector('.removeGiftButton').addEventListener('click', function () {
        container.removeChild(newGiftEntry);
    });

    container.appendChild(newGiftEntry);
});

// 결과 출력
document.getElementById('taxForm').onsubmit = function (e) {
    e.preventDefault();

    const relationship = document.getElementById('relationship').value;
    console.log('선택된 관계:', relationship);

    const exemptionLimit = exemptionLimits[relationship] || 0;
    console.log('적용된 공제 한도:', exemptionLimit);

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
    console.log('증여 금액:', giftAmount);

    const previousGiftInputs = document.getElementById('previousGifts').querySelectorAll('.amount-input');
    let previousGiftTotal = 0;
    previousGiftInputs.forEach(input => {
        const value = parseCurrency(input.value || '0');
        if (!isNaN(value)) previousGiftTotal += value;
    });
    console.log('과거 증여 금액 합산:', previousGiftTotal);

    const taxableAmount = Math.max(giftAmount - exemptionLimit - previousGiftTotal, 0);
    console.log('과세 표준:', taxableAmount);

    const giftTax = calculateGiftTax(taxableAmount);
    console.log('증여세:', giftTax);

    const giftDate = document.getElementById('giftDate')?.value;
    const submissionDate = document.getElementById('submissionDate')?.value;
    const latePenalty = calculateLatePenalty(submissionDate, giftDate, giftTax);

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>증여세:</strong> ${giftTax.toLocaleString()}원</p>
        <p><strong>가산세:</strong> ${latePenalty.toLocaleString()}원</p>
        <p><strong>최종 납부세액:</strong> ${(giftTax + latePenalty).toLocaleString()}원</p>
    `;
};
