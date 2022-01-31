'use strict';

const containerMovs = document.getElementById('movements');
const containerApp = document.getElementById('app');
const labelBalance = document.getElementById('label-bal');
const labelSumIn = document.getElementById('label-sum-in');
const labelSumOut = document.getElementById('label-sum-out');
const labelSumInterest = document.getElementById('label-sum-int');
const inputLoginUser = document.getElementById('input-user');
const inputLoginPin = document.getElementById('input-pin');
const formLogin = document.getElementById('form-login');
const labelWelcome = document.getElementById('label-welcome');
const formTransfer = document.getElementById('form-transfer');
const inputTransferTo = document.getElementById('input-transfer-to');
const inputTransferAmount = document.getElementById('input-transfer-amount');
const formLoan = document.getElementById('form-loan');
const inputLoanAmount = document.getElementById('input-loan-amount');
const formClose = document.getElementById('form-close');
const inputCloseUser = document.getElementById('input-close-user');
const inputClosePin = document.getElementById('input-close-pin');
const buttonSort = document.getElementById('btn-sort');
const labelBalDate = document.getElementById('balance-date');
const labelTimer = document.getElementById('timer');

let currentAccount = null;
let isSorted = false;
let logoutTimer = null;

const formatCurr = (value, locale, currency) =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
    }).format(value);

const formatMovDate = function (movDate, locale) {
    const calcDaysPassed = (date1, date2) =>
        Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));

    const now = new Date();
    const daysPassed = calcDaysPassed(now, movDate);

    if (daysPassed === 0) return 'Today';
    if (daysPassed === 1) return 'Yesterday';
    if (daysPassed <= 7) return `${daysPassed} days ago`;

    return new Intl.DateTimeFormat(locale).format(movDate);
};

const startLogoutTimer = function () {
    let time = 300;

    const tick = function () {
        if (time === 0) {
            clearInterval(logoutTimer);
            hideUI();
            labelWelcome.textContent = 'Log in to get started';
        }

        const minutes = (Math.trunc(time / 60) + '').padStart(2, 0);
        const seconds = ((time % 60) + '').padStart(2, 0);

        labelTimer.textContent = `${minutes}:${seconds}`;
        time--;
    };

    tick();
    const timer = setInterval(tick, 1000);

    return timer;
};

const printWelcome = function (name) {
    const now = new Date();

    const greetings = new Map([
        [[6, 7, 8, 9, 10], 'Good Morning'],
        [[11, 12, 13, 14], 'Good Day'],
        [[15, 16, 17, 18], 'Good Afternoon'],
        [[19, 20, 21, 22], 'Good Evening'],
        [[23, 0, 1, 2, 3, 4, 5], 'Good Night']
    ]);

    const arr = [...greetings.keys()].find(key => key.includes(now.getHours()));
    const greet = greetings.get(arr);

    labelWelcome.textContent = `${greet}, ${name}`;
};

const displayMovements = function (acc, sorted = false) {
    containerMovs.innerHTML = '';

    const movs = sorted ? [...acc.movements].sort((a, b) => a - b) : acc.movements;

    movs.forEach(function (mov, i) {
        const type = mov > 0 ? 'deposit' : 'withdrawal';

        const movDate = new Date(acc.movementsDates[i]);

        const formattedMov = formatCurr(mov, acc.locale, acc.currency);
        const formattedMovDate = formatMovDate(movDate, acc.locale);

        // prettier-ignore
        const markup = `
            <div class="movements__row">
                <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
                <div class="movements__date">${formattedMovDate}</div>
                <div class="movements__value">${formattedMov}</div>
            </div>
        `;

        containerMovs.insertAdjacentHTML('afterbegin', markup);
    });
};

const displayBalance = function (acc) {
    acc.balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
    const formattedBal = formatCurr(acc.balance, acc.locale, acc.currency);
    labelBalance.textContent = formattedBal;
};

const displaySummary = function (acc) {
    const sumIn = acc.movements.filter(mov => mov > 0).reduce((acc, mov) => acc + mov, 0);

    const sumOut = acc.movements
        .filter(mov => mov < 0)
        .reduce((acc, mov) => acc + mov, 0);

    const sumInt = acc.movements
        .filter(mov => mov > 0)
        .map(mov => (mov * acc.interestRate) / 100)
        .filter(int => int >= 1)
        .reduce((acc, mov) => acc + mov, 0);

    const formattedSumIn = formatCurr(sumIn, acc.locale, acc.currency);
    const formattedSumOut = formatCurr(Math.abs(sumOut), acc.locale, acc.currency);
    const formattedSumInt = formatCurr(sumInt, acc.locale, acc.currency);

    labelSumIn.textContent = formattedSumIn;
    labelSumOut.textContent = formattedSumOut;
    labelSumInterest.textContent = formattedSumInt;
};

const updateUI = function (account) {
    displayMovements(account);
    displayBalance(account);
    displaySummary(account);
};

const displayUI = function () {
    containerApp.style.opacity = 1;
    containerApp.style.visibility = 'visible';
};

const hideUI = function () {
    containerApp.style.opacity = 0;
    containerApp.style.visibility = 'hidden';
};

const createUserIds = function (accounts) {
    accounts.forEach(
        account =>
            (account.userid = account.owner
                .toLowerCase()
                .split(' ')
                .map(word => word[0])
                .join(''))
    );
};

// Initializing the application
inputLoginUser.focus();
createUserIds(accounts);
hideUI();

// Log in to the app
formLogin.addEventListener('submit', function (event) {
    event.preventDefault();

    const userId = inputLoginUser.value;
    const pin = +inputLoginPin.value;

    currentAccount = accounts.find(acc => acc.userid === userId);

    if (pin === currentAccount?.pin) {
        printWelcome(currentAccount.owner.split(' ')[0]);

        labelBalDate.textContent = new Intl.DateTimeFormat(currentAccount.locale, {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(new Date());

        displayUI();
        updateUI(currentAccount);

        if (logoutTimer) clearInterval(logoutTimer);
        logoutTimer = startLogoutTimer();

        inputLoginUser.value = inputLoginPin.value = '';
        inputLoginPin.blur();
    }
});

// Make transfer
formTransfer.addEventListener('submit', function (event) {
    event.preventDefault();

    const receiverId = inputTransferTo.value;
    const amount = +inputTransferAmount.value;

    const receiverAccount = accounts.find(acc => acc.userid === receiverId);

    if (
        receiverAccount &&
        receiverAccount.owner !== currentAccount.owner &&
        amount > 0 &&
        amount <= currentAccount.balance
    ) {
        currentAccount.movements.push(-amount);
        receiverAccount.movements.push(amount);

        // Add Dates
        currentAccount.movementsDates.push(new Date().toISOString());
        receiverAccount.movementsDates.push(new Date().toISOString());

        updateUI(currentAccount);

        inputTransferTo.value = inputTransferAmount.value = '';

        clearInterval(logoutTimer);
        logoutTimer = startLogoutTimer();
    }
});

// Request loan
formLoan.addEventListener('submit', function (event) {
    event.preventDefault();

    const amount = +inputLoanAmount.value;

    if (amount > 0 && currentAccount.movements.some(mov => mov >= amount * 0.1)) {
        setTimeout(function () {
            currentAccount.movements.push(amount);
            currentAccount.movementsDates.push(new Date().toISOString());

            updateUI(currentAccount);
        }, 2500);

        inputLoanAmount.value = '';

        clearInterval(logoutTimer);
        logoutTimer = startLogoutTimer();
    }
});

// Close the account
formClose.addEventListener('submit', function (event) {
    event.preventDefault();

    const userId = inputCloseUser.value;
    const pin = +inputClosePin.value;

    if (userId === currentAccount.userid && pin === currentAccount.pin) {
        currentAccount = null;

        const deleteIndex = accounts.findIndex(acc => acc.userid === userId);
        accounts.splice(deleteIndex, 1);

        inputCloseUser.value = inputClosePin.value = '';
        labelWelcome.textContent = 'Log in to get started';
        hideUI();
    }
});

// Sort Movements
buttonSort.addEventListener('click', function (event) {
    isSorted = !isSorted;
    displayMovements(currentAccount, isSorted);
});
