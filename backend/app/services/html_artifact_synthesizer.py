import re
from typing import Tuple, List, Dict, Any

def generate_pmf_engine_html(title: str = "Superhuman 40% PMF Engine") -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Superhuman 40% PMF Engine</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans min-h-screen">
  <div class="max-w-2xl mx-auto space-y-5">
    <!-- Header -->
    <div class="border-b border-slate-800 pb-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs font-mono uppercase tracking-wider text-amber-400">Rahul Vohra & Sean Ellis Framework</span>
          <h1 class="text-xl sm:text-2xl font-bold text-white mt-1">Superhuman 40% PMF Engine</h1>
        </div>
        <div id="pmfBadge" class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          PMF Achieved
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-1">"How would you feel if you could no longer use this product?"</p>
    </div>

    <!-- Live Score Meter Card -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
      <div class="flex items-baseline justify-between mb-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Sean Ellis PMF Score</span>
        <div class="text-right">
          <span id="scoreText" class="text-3xl sm:text-4xl font-extrabold text-emerald-400">42%</span>
          <span class="text-xs text-slate-500 ml-1">/ 40% benchmark</span>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-slate-800 rounded-full h-3.5 p-0.5 relative overflow-hidden">
        <div class="absolute top-0 bottom-0 left-[40%] w-0.5 bg-amber-400/80 z-10" title="40% PMF Threshold"></div>
        <div id="progressBar" class="bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300" style="width: 42%;"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
        <span>0%</span>
        <span class="text-amber-400 font-bold">▲ 40% Threshold</span>
        <span>100%</span>
      </div>
    </div>

    <!-- Sliders Form -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">Survey Response Distribution</h2>

      <!-- Very Disappointed -->
      <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Very Disappointed (Core Lovers)
          </label>
          <span id="valVery" class="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">42%</span>
        </div>
        <input type="range" id="sliderVery" min="0" max="100" value="42" class="w-full accent-emerald-400 cursor-pointer">
      </div>

      <!-- Somewhat Disappointed -->
      <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            Somewhat Disappointed (The Opportunity)
          </label>
          <span id="valSomewhat" class="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800">38%</span>
        </div>
        <input type="range" id="sliderSomewhat" min="0" max="100" value="38" class="w-full accent-amber-400 cursor-pointer">
      </div>

      <!-- Not Disappointed -->
      <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            Not Disappointed (Politely Ignore)
          </label>
          <span id="valNot" class="text-xs font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800">20%</span>
        </div>
        <input type="range" id="sliderNot" min="0" max="100" value="20" class="w-full accent-rose-400 cursor-pointer">
      </div>
    </div>

    <!-- Rahul Vohra 50/50 Allocation Strategy -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Rahul Vohra 50/50 Roadmap Allocator</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
          <div class="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">50% Engineering Capacity</div>
          <div class="text-xs text-slate-200 font-semibold mt-1">Double Down on What Lovers Love</div>
          <p class="text-[11px] text-slate-400 mt-1">Build features that make the 'Very Disappointed' cohort rave and refer others.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30">
          <div class="text-[11px] font-bold text-amber-400 uppercase tracking-wide">50% Engineering Capacity</div>
          <div class="text-xs text-slate-200 font-semibold mt-1">Systematically Address Objections</div>
          <p class="text-[11px] text-slate-400 mt-1">Eliminate specific friction points holding back the 'Somewhat Disappointed' group.</p>
        </div>
      </div>
      <div class="mt-3 p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-300">
        <span class="font-bold">0% Capacity for 'Not Disappointed':</span> Politely ignore feedback from users who wouldn't care if your product disappeared. Building for them dilutes focus and stalls PMF.
      </div>
    </div>

    <!-- Live Tactical Diagnosis -->
    <div id="diagnosisBox" class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs leading-relaxed text-emerald-200">
      <span class="font-bold">Tactical Diagnosis:</span> At 42%, your product has passed the 40% PMF threshold. Begin investing in scalable acquisition channels and self-serve onboarding while maintaining the 50/50 roadmap balance.
    </div>
  </div>

  <script>
    const sliderVery = document.getElementById('sliderVery');
    const sliderSomewhat = document.getElementById('sliderSomewhat');
    const sliderNot = document.getElementById('sliderNot');
    const valVery = document.getElementById('valVery');
    const valSomewhat = document.getElementById('valSomewhat');
    const valNot = document.getElementById('valNot');
    const scoreText = document.getElementById('scoreText');
    const progressBar = document.getElementById('progressBar');
    const pmfBadge = document.getElementById('pmfBadge');
    const diagnosisBox = document.getElementById('diagnosisBox');

    function update() {
      let v = parseInt(sliderVery.value);
      let s = parseInt(sliderSomewhat.value);
      let n = parseInt(sliderNot.value);
      let total = v + s + n || 1;

      let pV = Math.round((v / total) * 100);
      let pS = Math.round((s / total) * 100);
      let pN = 100 - pV - pS;

      valVery.textContent = pV + '%';
      valSomewhat.textContent = pS + '%';
      valNot.textContent = pN + '%';

      scoreText.textContent = pV + '%';
      progressBar.style.width = Math.min(100, Math.max(0, pV)) + '%';

      if (pV >= 40) {
        scoreText.className = 'text-3xl sm:text-4xl font-extrabold text-emerald-400';
        progressBar.className = 'bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300';
        pmfBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        pmfBadge.textContent = 'PMF Achieved (≥40%)';
        diagnosisBox.className = 'p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs leading-relaxed text-emerald-200';
        diagnosisBox.innerHTML = '<span class="font-bold text-emerald-300">Tactical Diagnosis:</span> At ' + pV + '%, your product has crossed the 40% PMF threshold! You are ready to accelerate growth. Execute the 50/50 roadmap: half your team doubles down on speed/delight for core lovers, and half removes key blockers for the somewhat-disappointed cohort.';
      } else if (pV >= 30) {
        scoreText.className = 'text-3xl sm:text-4xl font-extrabold text-amber-400';
        progressBar.className = 'bg-amber-500 h-2.5 rounded-full transition-all duration-300';
        pmfBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40';
        pmfBadge.textContent = 'Approaching PMF (30-39%)';
        diagnosisBox.className = 'p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs leading-relaxed text-amber-200';
        diagnosisBox.innerHTML = '<span class="font-bold text-amber-300">Tactical Diagnosis:</span> At ' + pV + '%, you are approaching PMF but will churn users if you scale paid marketing. Narrow your High-Expectation Customer (HXC) definition. Survey the somewhat-disappointed users on what primary feature is missing, and build it.';
      } else {
        scoreText.className = 'text-3xl sm:text-4xl font-extrabold text-rose-400';
        progressBar.className = 'bg-rose-500 h-2.5 rounded-full transition-all duration-300';
        pmfBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
        pmfBadge.textContent = 'High Churn Risk (<30%)';
        diagnosisBox.className = 'p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs leading-relaxed text-rose-200';
        diagnosisBox.innerHTML = '<span class="font-bold text-rose-300">Tactical Diagnosis:</span> At ' + pV + '%, the core value proposition is not resonating. Do NOT invest in growth loops or paid acquisition. Conduct 15-20 qualitative customer interviews with the few who were very disappointed to discover the true underlying job-to-be-done.';
      }
    }

    sliderVery.addEventListener('input', update);
    sliderSomewhat.addEventListener('input', update);
    sliderNot.addEventListener('input', update);
    update();
  </script>
</body>
</html>"""

def generate_jtbd_switching_simulator_html(title: str = "Bob Moesta JTBD 4 Forces Switching Simulator") -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bob Moesta JTBD 4 Forces Switching Simulator</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans min-h-screen">
  <div class="max-w-2xl mx-auto space-y-5">
    <!-- Header -->
    <div class="border-b border-slate-800 pb-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs font-mono uppercase tracking-wider text-sky-400">Jobs-to-be-Done Framework</span>
          <h1 class="text-xl sm:text-2xl font-bold text-white mt-1">Bob Moesta 4 Forces of Switching</h1>
        </div>
        <div id="statusBadge" class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          Switch Likely
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-1">Net Switching Force = (Push + Pull) − (Anxiety + Habit)</p>
    </div>

    <!-- Likelihood Score Gauge -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
      <div class="flex items-baseline justify-between mb-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Switching Momentum</span>
        <div class="text-right">
          <span id="netScore" class="text-3xl sm:text-4xl font-extrabold text-emerald-400">+40</span>
          <span class="text-xs text-slate-500 ml-1">pts</span>
        </div>
      </div>
      
      <!-- Balance Meter -->
      <div class="w-full bg-slate-800 rounded-full h-3.5 p-0.5 relative overflow-hidden">
        <div class="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600 z-10" title="Neutral 0 Point"></div>
        <div id="balanceBar" class="bg-emerald-400 h-2.5 rounded-full transition-all duration-300" style="width: 70%; margin-left: 0%;"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
        <span>-100 (Inertia Wins)</span>
        <span>0 (Neutral)</span>
        <span>+100 (Switch Inevitable)</span>
      </div>
    </div>

    <!-- 4 Forces Sliders -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Force 1: Push -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="flex justify-between items-center mb-1.5">
          <label class="text-xs font-bold text-sky-300">1. Push of Current Situation</label>
          <span id="valPush" class="text-xs font-mono font-bold text-sky-400">65</span>
        </div>
        <p class="text-[10px] text-slate-400 mb-2">Pain, friction, or dissatisfaction with existing workaround.</p>
        <input type="range" id="sliderPush" min="0" max="100" value="65" class="w-full accent-sky-400 cursor-pointer">
      </div>

      <!-- Force 2: Pull -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="flex justify-between items-center mb-1.5">
          <label class="text-xs font-bold text-sky-300">2. Pull of New Solution</label>
          <span id="valPull" class="text-xs font-mono font-bold text-sky-400">75</span>
        </div>
        <p class="text-[10px] text-slate-400 mb-2">Attraction to better outcomes, speed, and new superpowers.</p>
        <input type="range" id="sliderPull" min="0" max="100" value="75" class="w-full accent-sky-400 cursor-pointer">
      </div>

      <!-- Force 3: Anxiety -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="flex justify-between items-center mb-1.5">
          <label class="text-xs font-bold text-rose-300">3. Anxiety of the New</label>
          <span id="valAnxiety" class="text-xs font-mono font-bold text-rose-400">45</span>
        </div>
        <p class="text-[10px] text-slate-400 mb-2">Fear of learning curve, data loss, buyer regret, or cost.</p>
        <input type="range" id="sliderAnxiety" min="0" max="100" value="45" class="w-full accent-rose-400 cursor-pointer">
      </div>

      <!-- Force 4: Habit -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="flex justify-between items-center mb-1.5">
          <label class="text-xs font-bold text-rose-300">4. Habit of the Present</label>
          <span id="valHabit" class="text-xs font-mono font-bold text-rose-400">55</span>
        </div>
        <p class="text-[10px] text-slate-400 mb-2">Muscle memory, existing workflows, and inertia.</p>
        <input type="range" id="sliderHabit" min="0" max="100" value="55" class="w-full accent-rose-400 cursor-pointer">
      </div>
    </div>

    <!-- Live Tactical Diagnosis -->
    <div id="diagnosisCard" class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-300">Bob Moesta Actionable Playbook</div>
      <p id="tacticalAdvice" class="text-xs text-slate-300 leading-relaxed">
        Net momentum is positive (+40). Customers are primed to switch. To accelerate conversion, reduce **Anxiety** with a 14-day free trial or migration concierge rather than spending more on marketing.
      </p>
    </div>
  </div>

  <script>
    const sliderPush = document.getElementById('sliderPush');
    const sliderPull = document.getElementById('sliderPull');
    const sliderAnxiety = document.getElementById('sliderAnxiety');
    const sliderHabit = document.getElementById('sliderHabit');
    const valPush = document.getElementById('valPush');
    const valPull = document.getElementById('valPull');
    const valAnxiety = document.getElementById('valAnxiety');
    const valHabit = document.getElementById('valHabit');
    const netScore = document.getElementById('netScore');
    const balanceBar = document.getElementById('balanceBar');
    const statusBadge = document.getElementById('statusBadge');
    const tacticalAdvice = document.getElementById('tacticalAdvice');

    function calculate() {
      let push = parseInt(sliderPush.value);
      let pull = parseInt(sliderPull.value);
      let anxiety = parseInt(sliderAnxiety.value);
      let habit = parseInt(sliderHabit.value);

      valPush.textContent = push;
      valPull.textContent = pull;
      valAnxiety.textContent = anxiety;
      valHabit.textContent = habit;

      let forward = push + pull;
      let friction = anxiety + habit;
      let net = forward - friction;

      netScore.textContent = (net >= 0 ? '+' : '') + net;

      // Map -100..+100 to 0%..100%
      let pct = Math.min(100, Math.max(0, (net + 100) / 2));
      balanceBar.style.width = pct + '%';

      if (net > 20) {
        netScore.className = 'text-3xl sm:text-4xl font-extrabold text-emerald-400';
        balanceBar.className = 'bg-emerald-400 h-2.5 rounded-full transition-all duration-300';
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        statusBadge.textContent = 'High Switch Likelihood';
        tacticalAdvice.innerHTML = '<span class="font-bold text-emerald-300">Customer Primed to Switch:</span> Forward forces (Push ' + push + ' + Pull ' + pull + ' = ' + forward + ') heavily outweigh friction. Maintain clear onboarding and reduce the initial time-to-value so habits can form quickly.';
      } else if (net >= -15) {
        netScore.className = 'text-3xl sm:text-4xl font-extrabold text-amber-400';
        balanceBar.className = 'bg-amber-400 h-2.5 rounded-full transition-all duration-300';
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40';
        statusBadge.textContent = 'Stalled Decision Zone';
        tacticalAdvice.innerHTML = '<span class="font-bold text-amber-300">Friction Blocking Adoption:</span> Forward force (' + forward + ') is battling inertia (' + friction + '). Do NOT just add more features. Either amplify the Push (highlight the cost of their current problem) or eliminate Anxiety (offer migration tools and zero-risk guarantees).';
      } else {
        netScore.className = 'text-3xl sm:text-4xl font-extrabold text-rose-400';
        balanceBar.className = 'bg-rose-400 h-2.5 rounded-full transition-all duration-300';
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
        statusBadge.textContent = 'Customer Inertia Dominates';
        tacticalAdvice.innerHTML = '<span class="font-bold text-rose-300">No Switch Will Occur:</span> Habit (' + habit + ') and Anxiety (' + anxiety + ') are overpowering the desire to change. The current pain is not sharp enough. You must fundamentally redefine the target customer who experiences an acute, unavoidable crisis today.';
      }
    }

    sliderPush.addEventListener('input', calculate);
    sliderPull.addEventListener('input', calculate);
    sliderAnxiety.addEventListener('input', calculate);
    sliderHabit.addEventListener('input', calculate);
    calculate();
  </script>
</body>
</html>"""

def generate_plg_loop_simulator_html(title: str = "Elena Verna B2B PLG Loop Simulator") -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elena Verna B2B PLG Loop Simulator</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans min-h-screen">
  <div class="max-w-2xl mx-auto space-y-5">
    <!-- Header -->
    <div class="border-b border-slate-800 pb-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs font-mono uppercase tracking-wider text-amber-400">Elena Verna B2B Growth Strategy</span>
          <h1 class="text-xl sm:text-2xl font-bold text-white mt-1">Product-Led Growth Loop Engine</h1>
        </div>
        <div id="kBadge" class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          K = 0.40 (Healthy)
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-1">Viral Coefficient K = Invites per User × Acceptance Rate</p>
    </div>

    <!-- Projected Compounding Growth -->
    <div class="grid grid-cols-3 gap-3">
      <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <span class="text-[10px] font-semibold text-slate-400 uppercase">Month 1 Users</span>
        <div id="m1Users" class="text-lg sm:text-2xl font-bold text-white mt-1">1,500</div>
      </div>
      <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <span class="text-[10px] font-semibold text-slate-400 uppercase">Month 2 Users</span>
        <div id="m2Users" class="text-lg sm:text-2xl font-bold text-amber-400 mt-1">2,100</div>
      </div>
      <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <span class="text-[10px] font-semibold text-slate-400 uppercase">Month 3 Users</span>
        <div id="m3Users" class="text-lg sm:text-2xl font-bold text-emerald-400 mt-1">2,940</div>
      </div>
    </div>

    <!-- Sliders Form -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">Loop Parameter Sliders</h2>

      <!-- Monthly Base Signups -->
      <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-bold text-slate-300">Monthly Organic / Base Signups</label>
          <span id="valBase" class="text-xs font-mono font-bold text-amber-400">1,500</span>
        </div>
        <input type="range" id="sliderBase" min="100" max="10000" step="100" value="1500" class="w-full accent-amber-400 cursor-pointer">
      </div>

      <!-- Invites Per User -->
      <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-bold text-slate-300">Colleague Invites Sent Per Active User</label>
          <span id="valInvites" class="text-xs font-mono font-bold text-amber-400">1.8</span>
        </div>
        <input type="range" id="sliderInvites" min="0.1" max="5.0" step="0.1" value="1.8" class="w-full accent-amber-400 cursor-pointer">
      </div>

      <!-- Invite Acceptance Rate -->
      <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-bold text-slate-300">Invite-to-Signup Acceptance Rate</label>
          <span id="valAccept" class="text-xs font-mono font-bold text-emerald-400">22%</span>
        </div>
        <input type="range" id="sliderAccept" min="5" max="60" value="22" class="w-full accent-emerald-400 cursor-pointer">
      </div>

      <!-- Free to Paid Conversion -->
      <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-bold text-slate-300">Self-Serve Paid Conversion Rate</label>
          <span id="valPaid" class="text-xs font-mono font-bold text-sky-400">4.5%</span>
        </div>
        <input type="range" id="sliderPaid" min="1.0" max="15.0" step="0.5" value="4.5" class="w-full accent-sky-400 cursor-pointer">
      </div>
    </div>

    <!-- Elena Verna Strategy Box -->
    <div id="plgAdvice" class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs leading-relaxed text-slate-300">
      <span class="font-bold text-amber-400">Elena Verna's PLG Principle:</span> In B2B, a viral K-factor of 0.40 is extraordinary because every newly invited user brings their team. Do not gate team collaboration behind paid paywalls—monetize admin controls, audit logs, and scale instead.
    </div>
  </div>

  <script>
    const sliderBase = document.getElementById('sliderBase');
    const sliderInvites = document.getElementById('sliderInvites');
    const sliderAccept = document.getElementById('sliderAccept');
    const sliderPaid = document.getElementById('sliderPaid');

    const valBase = document.getElementById('valBase');
    const valInvites = document.getElementById('valInvites');
    const valAccept = document.getElementById('valAccept');
    const valPaid = document.getElementById('valPaid');

    const m1Users = document.getElementById('m1Users');
    const m2Users = document.getElementById('m2Users');
    const m3Users = document.getElementById('m3Users');
    const kBadge = document.getElementById('kBadge');

    function update() {
      let base = parseInt(sliderBase.value);
      let invites = parseFloat(sliderInvites.value);
      let accept = parseInt(sliderAccept.value) / 100;
      let paidRate = parseFloat(sliderPaid.value) / 100;

      valBase.textContent = base.toLocaleString();
      valInvites.textContent = invites.toFixed(1);
      valAccept.textContent = Math.round(accept * 100) + '%';
      valPaid.textContent = (paidRate * 100).toFixed(1) + '%';

      let k = invites * accept;
      kBadge.textContent = 'K = ' + k.toFixed(2) + (k >= 1.0 ? ' (Viral Loop!)' : ' (Self-Serve)');

      let m1 = base;
      let m2 = Math.round(m1 + (m1 * k));
      let m3 = Math.round(m2 + (m2 * k));

      m1Users.textContent = m1.toLocaleString();
      m2Users.textContent = m2.toLocaleString();
      m3Users.textContent = m3.toLocaleString();
    }

    sliderBase.addEventListener('input', update);
    sliderInvites.addEventListener('input', update);
    sliderAccept.addEventListener('input', update);
    sliderPaid.addEventListener('input', update);
    update();
  </script>
</body>
</html>"""

def synthesize_html_artifact(message: str, content: str = "", chunks: List[Dict[str, Any]] = None) -> Tuple[str, str]:
    """Inspect query and content to return the exact interactive HTML application."""
    text_corpus = f"{message} {content}".lower()

    # 1. Elena Verna / B2B PLG Loop Simulator
    if any(k in text_corpus for k in ["elena verna", "verna", "plg", "product-led", "product led", "k-factor", "viral loop", "plg loop"]):
        return ("Interactive Prototype: Elena Verna B2B PLG Loop Simulator", generate_plg_loop_simulator_html())

    # 2. Bob Moesta / JTBD Switching Simulator
    if any(k in text_corpus for k in ["jtbd", "moesta", "jobs to be done", "jobs-to-be-done", "switching simulator", "forces of switching", "4 forces", "four forces"]):
        return ("Interactive Prototype: Bob Moesta JTBD Switching Simulator", generate_jtbd_switching_simulator_html())

    # 3. Rahul Vohra / Superhuman PMF Engine
    if any(k in text_corpus for k in ["pmf", "vohra", "superhuman", "ellis", "sean ellis", "40% rule", "how disappointed", "product market fit"]):
        return ("Interactive Prototype: Superhuman 40% PMF Engine", generate_pmf_engine_html())

    # Fallback to Superhuman PMF Engine as standard interactive prototype
    return ("Interactive Prototype: Growth Metric Simulator", generate_pmf_engine_html("Interactive Growth Engine"))
