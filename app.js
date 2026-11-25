// ============================================================
// 퀴즈 앱 전체 흐름 (이것만 알면 코드가 읽혀요!)
//
//  [1] 페이지가 열린다  → loadQuestions()   questions.json 불러오기
//  [2] "시작하기" 클릭   → startQuiz()       점수/오답 초기화 후 첫 문제
//  [3] 문제 보여주기     → showQuestion()    문제와 보기 4개를 화면에 그림
//  [4] 보기 클릭         → selectAnswer()    채점 + 틀리면 오답 노트에 저장
//  [5] "다음" 클릭       → nextQuestion()    다음 문제 or 결과 화면
//  [6] 결과 화면         → showResult()      점수 + 오답 노트 + 다시 풀기
//
//  핵심 아이디어: "상태(변수)를 바꾸고 → 화면을 다시 그린다"
// ============================================================

// ---------- 상태(앱이 기억하는 데이터) ----------
let allQuestions = [];   // questions.json 원본 전체
let questions = [];      // 이번 판에서 푸는 문제들
let currentIndex = 0;    // 지금 몇 번째 문제인지 (0부터 시작)
let score = 0;           // 맞힌 개수
let wrongNotes = [];     // 틀린 문제 기록 (오답 노트)
let answered = false;    // 이번 문제에 이미 답했는지 (중복 클릭 방지)

// ---------- 화면 요소 가져오기 ----------
const $ = (id) => document.getElementById(id);
const screens = {
  start: $('start-screen'),
  quiz: $('quiz-screen'),
  result: $('result-screen'),
};

// ---------- [1] 문제 불러오기 ----------
async function loadQuestions() {
  try {
    // fetch는 로컬 서버(npx serve)로 열어야 동작해요
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allQuestions = await res.json();

    $('load-message').textContent = `문제 ${allQuestions.length}개 준비 완료!`;
    $('start-btn').disabled = false;
  } catch (err) {
    $('load-message').textContent =
      '문제를 불러오지 못했어요. 파일을 더블클릭하지 말고 "npx serve"로 실행해 주세요.';
    $('load-message').classList.add('error');
  }
}

// ---------- 화면 전환 (하나만 보이게) ----------
function showScreen(name) {
  Object.keys(screens).forEach((key) => {
    screens[key].hidden = key !== name;
  });
}

// 배열 순서 섞기 (문제 순서를 매번 다르게)
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------- [2] 퀴즈 시작 ----------
function startQuiz(questionList) {
  questions = shuffle(questionList);
  currentIndex = 0;
  score = 0;
  wrongNotes = [];
  showScreen('quiz');
  showQuestion();
}

// ---------- [3] 문제 한 개를 화면에 그리기 ----------
function showQuestion() {
  const q = questions[currentIndex];
  answered = false;

  $('progress-text').textContent = `${currentIndex + 1} / ${questions.length}`;
  $('score-text').textContent = `점수 ${score}`;
  $('progress-bar').style.width = `${(currentIndex / questions.length) * 100}%`;
  $('question-text').textContent = q.question;
  $('feedback').hidden = true;
  $('next-btn').hidden = true;

  // 보기 버튼 만들기
  const box = $('choices');
  box.innerHTML = '';
  q.choices.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    // A/B/C/D 배지 + 보기 글자
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'ABCD'[i];
    const label = document.createElement('span');
    label.textContent = text;
    btn.append(badge, label);
    btn.addEventListener('click', () => selectAnswer(i));
    box.appendChild(btn);
  });
}

// ---------- [4] 보기를 눌렀을 때: 채점 ----------
function selectAnswer(picked) {
  if (answered) return;      // 이미 답했으면 무시
  answered = true;

  const q = questions[currentIndex];
  const buttons = document.querySelectorAll('.choice');
  const isCorrect = picked === q.answer;

  // 정답은 초록, 내가 고른 오답은 빨강으로 표시
  buttons[q.answer].classList.add('correct');
  if (!isCorrect) buttons[picked].classList.add('wrong');
  buttons.forEach((b) => (b.disabled = true));

  if (isCorrect) {
    score++;
  } else {
    // 틀렸으면 오답 노트에 저장
    wrongNotes.push({ question: q, picked: picked });
  }

  // 해설 보여주기
  $('feedback').textContent = (isCorrect ? '⭕ 정답! ' : '❌ 아쉬워요. ') + q.explanation;
  $('feedback').className = 'feedback ' + (isCorrect ? 'ok' : 'no');
  $('feedback').hidden = false;
  $('score-text').textContent = `점수 ${score}`;

  $('next-btn').textContent =
    currentIndex === questions.length - 1 ? '결과 보기 🎉' : '다음 문제 →';
  $('next-btn').hidden = false;
}

// ---------- [5] 다음 문제 or 끝 ----------
function nextQuestion() {
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// ---------- [6] 결과 화면 ----------
function showResult() {
  showScreen('result');
  const total = questions.length;
  // 점수를 100점 만점으로 바꿔서 숫자와 원형 그래프에 표시
  const percent = Math.round((score / total) * 100);
  $('result-score').textContent = percent;
  $('score-ring').style.setProperty('--pct', percent + '%');

  // 점수에 따른 한마디
  let comment = '다시 도전해 봐요! 오답 노트를 읽으면 금방 늘어요 💪';
  if (score === total) comment = '완벽해요! 🏆';
  else if (score >= total * 0.7) comment = '잘했어요! 👏';
  $('result-comment').textContent = comment;

  renderWrongNotes();
  // 틀린 게 없으면 "틀린 문제만" 버튼 숨김
  $('retry-wrong-btn').hidden = wrongNotes.length === 0;
}

// 오답 노트 그리기 (내 답 vs 정답 + 해설)
function renderWrongNotes() {
  const box = $('wrong-notes');
  box.innerHTML = '';

  if (wrongNotes.length === 0) {
    box.textContent = '틀린 문제가 없어요! 🎉';
    return;
  }

  wrongNotes.forEach((note) => {
    const q = note.question;
    const div = document.createElement('div');
    div.className = 'note';

    const title = document.createElement('strong');
    title.textContent = q.question;

    const mine = document.createElement('div');
    mine.className = 'mine';
    mine.textContent = `내 답: ${q.choices[note.picked]}`;

    const right = document.createElement('div');
    right.className = 'right';
    right.textContent = `정답: ${q.choices[q.answer]}`;

    const why = document.createElement('div');
    why.textContent = `💡 ${q.explanation}`;

    div.append(title, mine, right, why);
    box.appendChild(div);
  });
}

// ---------- 버튼 연결 (이벤트 리스너) ----------
$('start-btn').addEventListener('click', () => startQuiz(allQuestions));
$('next-btn').addEventListener('click', nextQuestion);
$('retry-all-btn').addEventListener('click', () => startQuiz(allQuestions));
$('retry-wrong-btn').addEventListener('click', () => {
  // 오답 노트에 있는 문제만 다시 풀기
  startQuiz(wrongNotes.map((n) => n.question));
});

// 페이지가 열리면 제일 먼저 실행
loadQuestions();
