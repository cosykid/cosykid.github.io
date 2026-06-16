// title displays the number of seconds spent on the sight
function secondsElapsed(seconds) {
  if (seconds != 1) {
    document.title = `${seconds} seconds wasted!`;
  } else {
    document.title = `${seconds} second wasted!`;
  }
}

let seconds = 0;
setInterval(() => {
  seconds++;
  secondsElapsed(seconds);
}, 1000);


// scroll animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  })
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((e) => observer.observe(e));

const observer2 = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('white');
    } else {
      entry.target.classList.remove('white');
    }
  })
});

const hiddenElements2 = document.querySelectorAll('.hidden');
hiddenElements2.forEach((e) => observer.observe(e));



// creates welcome text with alternating colors.
// refresh rate of container decreases until it becomes 1hz
const text = "Welcome to Langkee's timeline";
rotateColor = (pos) => {
  const welcome = document.getElementById("welcome");
  welcome.innerText = '';
  const colors = [
    'rgb(217, 47, 28)',
    'rgb(0, 148, 212)',
    'rgb(207, 159, 17)',
    'rgb(0, 156, 23)',
    ...Array(6).fill('white')
  ];

  const words = text.split(' ');
  
  words.forEach((word, index) => {
    const wordContainer = document.createElement("div");
    wordContainer.classList.add("word-container");

    for (let i = 0; i < word.length; i++) {
      const span = document.createElement("span");
      if (word[i] === ' ') {
        span.innerHTML = '&nbsp;';
        wordContainer.appendChild(span);
      } else {
        span.innerText = word[i];
        span.style.color = colors[(i + pos) % colors.length];
      }
      span.classList.add("welcome-text");
      wordContainer.appendChild(span);
    }

    welcome.appendChild(wordContainer);

    if (index < words.length - 1) {
      const spaceSpan = document.createElement("span");
      spaceSpan.innerHTML = '&nbsp;';
      welcome.appendChild(spaceSpan);
    }
  });
}

wrapper = (pos, frequency) => {
  pos > text.length ? pos = 0 : pos++;
  rotateColor(pos);
  if (frequency < 1000) {
    setTimeout(() => wrapper(pos + 1, frequency * 1.05), frequency);
  } else { 
    setTimeout(() => wrapper(pos + 1, frequency), frequency);
  }
}

wrapper(0, 10);

// gets and date and time for each country, updates it on the page every second
const countryTime = (id, timeZone, country) => {
  const date = new Date();
  const dateOutput = document.querySelector(id)
  const options = {
    timeZone: timeZone,
    hour12: true,
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  dateOutput.innerText = `As of ${date.toLocaleString('en-US', options).replace(' at', ', it is')} in ${country}.`;
}

setInterval(() => {
  countryTime('#korean-time', 'Asia/Seoul', 'Korea')
}, 1000);

setInterval(() => {
  countryTime('#nz-time', 'Pacific/Auckland', 'New Zealand')
}, 1000);

setInterval(() => {
  countryTime('#aus-time', 'Australia/Sydney', 'Sydney')
}, 1000);
