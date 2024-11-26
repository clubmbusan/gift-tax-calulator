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

    // 관계 공제 반영
    const relationship = document.getElementById('relationship').value;
    let exemptionLimit = 0;
    switch (relationship) {
        case 'child':
            exemptionLimit = 50000000;
            break;
        case 'minorChild':
            exemptionLimit = 20000000;
            break;
        case 'spouse':
            exemptionLimit = 600000000;
            break;
        case 'inLaw':
            exemptionLimit = 50000000;
            break;
        case 'other':
            exemptionLimit = 10000000;
            break;
        default:
            exemptionLimit = 50000000;
    }

    // 과거 증여 금액 합산
    const previousGiftInputs = document.getElementById('previousGifts').querySelectorAll('input');
    let previousGiftTotal = 0;
    previousGiftInputs.forEach(input => {
        const value = parseCurrency(input.value || '0');
        if (!isNaN(value)) {
            previousGiftTotal += value;
        }
    });

    const taxableAmount = Math.max(giftAmount - exemptionLimit - previousGiftTotal, 0);

    // 증여세 계산
    const giftTax = calculateGiftTax(taxableAmount);

    // 가산세 계산
    const giftDate = document.getElementById('giftDate')?.value;
    const submissionDate = document.getElementById('submissionDate')?.value;
    const latePenalty = calculateLatePenalty(submissionDate, giftDate, giftTax);

    // 결과 표시
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <p><strong>증여세:</strong> ${giftTax.toLocaleString()}원</p>
        <p><strong>가산세:</strong> ${latePenalty.toLocaleString()}원</p>
        <p><strong>최종 납부세액:</strong> ${(giftTax + latePenalty).toLocaleString()}원</p>
    `;
};
