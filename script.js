// 증여세 누진세 계산 로직
const taxBrackets = [
    { limit: 100000000, rate: 10, deduction: 0 },
    { limit: 500000000, rate: 20, deduction: 10000000 },
    { limit: 1000000000, rate: 30, deduction: 60000000 },
    { limit: 3000000000, rate: 40, deduction: 160000000 },
    { limit: Infinity, rate: 50, deduction: 460000000 }
];

// 증여세 계산 로직 추가
function calculateGiftTax(taxableAmount) {
    let tax = 0;
    console.log("과세 표준 (taxableAmount):", taxableAmount); // 디버깅 로그 추가

    for (let i = 0; i < taxBrackets.length; i++) {
        const bracket = taxBrackets[i];
        const prevLimit = taxBrackets[i - 1]?.limit || 0;

        if (taxableAmount > bracket.limit) {
            tax += (bracket.limit - prevLimit) * (bracket.rate / 100);
            console.log(`구간 초과 - 구간: ${i + 1}, 계산된 세금:`, tax); // 디버깅 로그
        } else {
            tax += (taxableAmount - prevLimit) * (bracket.rate / 100);
            console.log(`남은 금액에 대한 계산 - 구간: ${i + 1}, 계산된 세금:`, tax); // 디버깅 로그
            tax -= bracket.deduction; // 누진 공제 적용
            console.log(`누진 공제 (${bracket.deduction}) 적용 후 세금:`, tax); // 디버깅 로그
            break;
        }
    }
    return Math.max(tax, 0); // 음수 방지
}



// 금액 입력 시 콤마 처리
function parseCurrency(value) {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
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

// 증여세 계산 로직 (수정된 부분)
function calculateGiftTax(taxableAmount) {
    let tax = 0;
    for (let i = 0; i < taxBrackets.length; i++) {
        const bracket = taxBrackets[i];
        const prevLimit = taxBrackets[i - 1]?.limit || 0;

        if (taxableAmount > bracket.limit) {
            // 해당 구간의 최대 금액에 대해 세율 적용
            tax += (bracket.limit - prevLimit) * (bracket.rate / 100);
        } else {
            // 남은 금액에 대해 세율 적용
            tax += (taxableAmount - prevLimit) * (bracket.rate / 100);
            tax -= bracket.deduction; // 누진 공제 적용
            break;
        }
    }
    return Math.max(tax, 0); // 음수 방지
}

// 결과 출력 - 사용자 입력값으로 증여세, 가산세, 최종 세액을 계산하여 출력
document.getElementById('taxForm').onsubmit = function (e) {
    e.preventDefault(); // 기본 폼 제출 동작 방지

    // 재산 유형에 따라 증여 금액 계산
    const selectedType = document.getElementById('assetType').value; // 재산 유형 선택 값
    let giftAmount = 0; // 증여 금액 초기화

    if (selectedType === 'cash') {
        giftAmount = parseCurrency(document.getElementById('cashAmount')?.value || '0'); // 현금 금액 입력값
    } else if (selectedType === 'realEstate') {
        giftAmount = parseCurrency(document.getElementById('realEstateValue')?.value || '0'); // 부동산 금액 입력값
    } else if (selectedType === 'stock') {
        const stockQuantity = parseInt(document.getElementById('stockQuantity')?.value || '0', 10); // 주식 수량
        const stockPrice = parseCurrency(document.getElementById('stockPrice')?.value || '0'); // 주식 가격
        giftAmount = stockQuantity * stockPrice; // 주식 총 금액
    }

    // 관계에 따라 공제 한도 설정
    const relationship = document.getElementById('relationship').value; // 관계 선택 값
    let exemptionLimit = 0; // 공제 한도 초기화

    // 관계에 따른 공제 한도 조건문
    switch (relationship) {
        case 'child': // 성년 자녀
            exemptionLimit = 50000000; // 공제 한도: 50,000,000원
            break;
        case 'minorChild': // 미성년 자녀
            exemptionLimit = 20000000; // 공제 한도: 20,000,000원
            break;
        case 'spouse': // 배우자
            exemptionLimit = 600000000; // 공제 한도: 600,000,000원
            break;
        case 'inLaw': // 사위/며느리
            exemptionLimit = 50000000; // 공제 한도: 50,000,000원
            break;
        case 'other': // 기타
            exemptionLimit = 10000000; // 공제 한도: 10,000,000원
            break;
        default: // 기본 공제 (성년 자녀)
            exemptionLimit = 50000000;
    }

    // 과거 증여 금액 합산
    const previousGiftInputs = document.getElementById('previousGifts').querySelectorAll('input'); // 과거 증여 금액 입력 필드들
    let previousGiftTotal = 0; // 과거 증여 금액 총합 초기화
    previousGiftInputs.forEach(input => {
        const value = parseCurrency(input.value || '0'); // 입력값을 숫자로 변환
        if (!isNaN(value)) {
            previousGiftTotal += value; // 총합에 추가
        }
    });

    // 과세 표준 계산: 증여 금액 - 공제 한도 - 과거 증여 금액
    const taxableAmount = Math.max(giftAmount - exemptionLimit - previousGiftTotal, 0);
    console.log("최종 과세 표준 (taxableAmount):", taxableAmount); // 디버깅 로그

    // 증여세 계산
    const giftTax = calculateGiftTax(taxableAmount); // 계산된 증여세
    console.log("계산된 증여세 (giftTax):", giftTax); // 디버깅 로그

    // 가산세 계산
    const giftDate = document.getElementById('giftDate')?.value; // 증여일
    const submissionDate = document.getElementById('submissionDate')?.value; // 신고일
    const latePenalty = calculateLatePenalty(submissionDate, giftDate, giftTax); // 계산된 가산세

    // 결과를 HTML에 출력
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>증여세:</strong> ${giftTax.toLocaleString()}원</p>
        <p><strong>가산세:</strong> ${latePenalty.toLocaleString()}원</p>
        <p><strong>최종 납부세액:</strong> ${(giftTax + latePenalty).toLocaleString()}원</p>
    `;
};
