<template>
  <div class="min-h-full bg-default">
    <!-- SETUP VIEW -->
    <Transition name="view" mode="out-in">
      <div v-if="view === 'setup'" key="setup" class="mx-auto max-w-2xl px-4 py-6 space-y-6">

        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-highlighted">Practice Quiz</h1>
            <p class="text-sm text-muted mt-0.5">{{ totalQuestionCount }} questions across {{ chapters.length }} chapters</p>
          </div>
          <!-- XP Badge -->
          <div class="flex flex-col items-end gap-0.5">
            <div class="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
              <span class="text-base">{{ currentLevel.emoji }}</span>
              <span class="text-sm font-semibold text-primary">{{ currentLevel.name }}</span>
              <span class="text-xs text-primary/70 font-mono">{{ xp }} XP</span>
            </div>
            <div v-if="nextLevel" class="text-xs text-muted/70">{{ xpToNextLevel }} XP to {{ nextLevel.name }}</div>
          </div>
        </div>

        <!-- Chapter grid -->
        <div class="space-y-2.5">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted">Chapter</p>
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <!-- All chapters option -->
            <button
              class="col-span-2 sm:col-span-3 flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150"
              :class="selectedChapter === null
                ? 'border-primary bg-primary/10'
                : 'border-default hover:border-primary/40 hover:bg-default/80'"
              @click="selectedChapter = null"
            >
              <span class="text-xl">📚</span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-sm text-highlighted">All Chapters</p>
                <p class="text-xs text-muted">{{ totalQuestionCount }} questions</p>
              </div>
              <UIcon v-if="selectedChapter === null" name="i-heroicons-check-circle-solid" class="h-5 w-5 shrink-0 text-primary" />
            </button>

            <!-- Individual chapter cards -->
            <button
              v-for="ch in chapters"
              :key="ch.id"
              class="flex flex-col items-start gap-1.5 rounded-xl border-2 px-3 py-3 text-left transition-all duration-150 active:scale-[0.97]"
              :class="selectedChapter === ch.id
                ? `border-primary bg-primary/10`
                : 'border-default hover:border-primary/40'"
              @click="selectedChapter = ch.id"
            >
              <div class="flex w-full items-start justify-between gap-1">
                <span class="text-xl leading-none">{{ ch.emoji }}</span>
                <UIcon v-if="selectedChapter === ch.id" name="i-heroicons-check-circle-solid" class="h-4 w-4 shrink-0 text-primary" />
              </div>
              <p class="text-xs font-semibold leading-snug text-highlighted">{{ ch.name }}</p>
              <p class="text-[10px] text-muted/80 leading-snug">{{ getChapterQuestionCount(ch.id) }}q</p>
            </button>
          </div>
        </div>

        <!-- Type + Difficulty + Count -->
        <div class="grid gap-3 sm:grid-cols-3">
          <!-- Type -->
          <div class="rounded-xl border border-default bg-elevated/40 p-3.5 space-y-2.5">
            <p class="text-xs font-semibold uppercase tracking-widest text-muted">Type</p>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="t in TYPES" :key="t.value"
                class="rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all"
                :class="selectedType === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-default text-muted hover:border-primary/50 hover:text-primary/80'"
                @click="selectedType = t.value">
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Difficulty -->
          <div class="rounded-xl border border-default bg-elevated/40 p-3.5 space-y-2.5">
            <p class="text-xs font-semibold uppercase tracking-widest text-muted">Difficulty</p>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="d in DIFFICULTIES" :key="d.value"
                class="rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all"
                :class="selectedDifficulty === d.value ? d.activeClass : 'border-default text-muted hover:border-primary/50'"
                @click="selectedDifficulty = d.value">
                {{ d.label }}
              </button>
            </div>
          </div>

          <!-- Count -->
          <div class="rounded-xl border border-default bg-elevated/40 p-3.5 space-y-2.5">
            <p class="text-xs font-semibold uppercase tracking-widest text-muted">Questions</p>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="n in COUNTS" :key="n"
                class="h-8 w-8 rounded-lg border text-xs font-bold transition-all"
                :class="questionCount === n ? 'border-primary bg-primary text-white' : 'border-default text-muted hover:border-primary hover:text-primary'"
                @click="questionCount = n">
                {{ n }}
              </button>
            </div>
          </div>
        </div>

        <!-- Available count warning -->
        <p v-if="!countsLoading && availableCount < questionCount" class="text-xs text-amber-600 flex items-center gap-1.5">
          <UIcon name="i-heroicons-information-circle" class="h-4 w-4 shrink-0" />
          Only {{ availableCount }} questions match your filters — quiz will use all of them.
        </p>

        <p v-if="countsLoading" class="text-xs text-muted flex items-center gap-1.5">
          <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 shrink-0 animate-spin" />
          Loading available questions...
        </p>

        <p v-if="prepareQuizError" class="text-xs text-red-500 flex items-center gap-1.5">
          <UIcon name="i-heroicons-exclamation-circle" class="h-4 w-4 shrink-0" />
          {{ prepareQuizError }}
        </p>

        <!-- Start button -->
        <button
          class="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold transition-all duration-150 active:scale-[0.98]"
          :class="availableCount > 0 && !isPreparingQuiz && !countsLoading
            ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:brightness-110'
            : 'cursor-not-allowed bg-elevated text-muted'"
          :disabled="availableCount === 0 || isPreparingQuiz || countsLoading"
          @click="handleStart"
        >
          <UIcon :name="isPreparingQuiz ? 'i-heroicons-arrow-path' : 'i-heroicons-play-circle-solid'" class="h-5 w-5" :class="isPreparingQuiz ? 'animate-spin' : ''" />
          {{ isPreparingQuiz ? 'Preparing Quiz...' : 'Start Quiz' }}
          <span class="opacity-70 text-sm font-normal">({{ Math.min(availableCount, questionCount) }} questions)</span>
        </button>

      </div>

      <!-- ACTIVE VIEW -->
      <div v-else-if="view === 'active'" key="active" class="flex h-full flex-col">

        <!-- Sticky progress header -->
        <div class="sticky top-0 z-10 border-b border-default bg-default/95 backdrop-blur px-4 py-3 space-y-2">
          <div class="flex items-center justify-between text-xs font-medium text-muted">
            <span class="flex items-center gap-1.5">
              <button class="flex items-center gap-1 hover:text-primary transition-colors" @click="resetQuiz">
                <UIcon name="i-heroicons-x-mark" class="h-3.5 w-3.5" />
                Quit
              </button>
            </span>
            <span class="font-mono tabular-nums text-highlighted font-semibold">
              {{ currentIdx + 1 }} / {{ questions.length }}
            </span>
            <span class="flex items-center gap-1">
              <span class="text-primary font-semibold">{{ answeredCount }}</span>
              <span>answered</span>
            </span>
          </div>
          <div class="relative h-1.5 w-full overflow-hidden rounded-full bg-elevated">
            <div class="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${((currentIdx + 1) / questions.length) * 100}%` }" />
          </div>
        </div>

        <!-- Question area (scrollable) -->
        <div class="flex-1 overflow-y-auto px-4 py-5">
          <Transition name="q-slide" mode="out-in">
            <div :key="currentIdx" class="mx-auto max-w-2xl space-y-5">

              <!-- Chips -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="chapterChipClass">
                  {{ currentChapterName }}
                </span>
                <span v-if="currentQuestion?.type === 'mc' && 'difficulty' in currentQuestion"
                  class="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  :class="difficultyChipClass">
                  {{ (currentQuestion as any).difficulty }}
                </span>
                <span class="rounded-full border border-default px-2.5 py-0.5 text-xs text-muted uppercase tracking-wide">
                  {{ typeLabel }}
                </span>
              </div>

              <!-- Question text -->
              <p class="text-lg font-semibold leading-snug text-highlighted sm:text-xl">
                {{ currentQuestion?.question }}
              </p>

              <!-- MC Options -->
              <div v-if="currentQuestion?.type === 'mc'" class="space-y-2.5">
                <button
                  v-for="(opt, idx) in currentQuestion.options"
                  :key="idx"
                  class="group w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm transition-all duration-150 focus:outline-none active:scale-[0.99]"
                  :class="mcOptionClass(idx)"
                  :disabled="isAnswered"
                  @click="submitMcAnswer(idx)"
                >
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors"
                    :class="mcLetterClass(idx)">
                    {{ LETTERS[idx] }}
                  </span>
                  <span class="flex-1 leading-snug">{{ opt }}</span>
                  <UIcon v-if="isAnswered && idx === (currentQuestion as any).answer"
                    name="i-heroicons-check-circle-solid" class="h-5 w-5 shrink-0 text-green-500" />
                  <UIcon v-else-if="isAnswered && idx === currentAnswer && idx !== (currentQuestion as any).answer"
                    name="i-heroicons-x-circle-solid" class="h-5 w-5 shrink-0 text-red-500" />
                </button>
              </div>

              <!-- TF Options -->
              <div v-else-if="currentQuestion?.type === 'tf'" class="grid grid-cols-2 gap-3">
                <button
                  v-for="val in [true, false]"
                  :key="String(val)"
                  class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-6 text-sm font-bold transition-all duration-150 active:scale-[0.98]"
                  :class="tfOptionClass(val)"
                  :disabled="isAnswered"
                  @click="submitTfAnswer(val)"
                >
                  <UIcon :name="val ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" class="h-7 w-7" />
                  {{ val ? 'TRUE' : 'FALSE' }}
                </button>
              </div>

              <!-- SA Input -->
              <div v-else-if="currentQuestion?.type === 'sa'" class="space-y-3">
                <textarea
                  v-model="saInputText"
                  :disabled="saSubmitted[currentIdx]"
                  rows="5"
                  placeholder="Type your answer here..."
                  class="w-full resize-none rounded-xl border border-default bg-elevated/40 px-4 py-3 text-sm text-highlighted placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
                />
                <button v-if="!saSubmitted[currentIdx]"
                  class="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]"
                  :class="saInputText.trim() ? 'bg-primary text-white shadow-sm hover:brightness-110' : 'cursor-not-allowed bg-elevated text-muted'"
                  :disabled="!saInputText.trim()"
                  @click="submitSaText(saInputText)">
                  Submit Answer
                </button>

                <!-- SA: show key answer + self grade -->
                <Transition name="reveal">
                  <div v-if="saSubmitted[currentIdx]" class="space-y-3">
                    <div class="rounded-xl border border-amber-400/30 bg-amber-500/8 p-4">
                      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">Key Answer</p>
                      <p class="text-sm leading-relaxed text-muted">{{ currentQuestion.answer }}</p>
                    </div>
                    <div v-if="!saGrades[currentQuestion.id]" class="space-y-2">
                      <p class="text-xs font-semibold text-muted text-center">How did you do?</p>
                      <div class="grid grid-cols-3 gap-2">
                        <button v-for="g in SA_GRADES" :key="g.value"
                          class="flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-semibold transition-all active:scale-[0.97]"
                          :class="g.btnClass"
                          @click="selfGradeSa(g.value)">
                          <span class="text-lg">{{ g.emoji }}</span>
                          {{ g.label }}
                        </button>
                      </div>
                    </div>
                    <div v-else class="flex items-center justify-center gap-2 rounded-xl border border-default py-2.5 text-xs font-semibold"
                      :class="saGradeColor">
                      <span>{{ SA_GRADES.find(g => g.value === saGrades[currentQuestion?.id ?? -1])?.emoji }}</span>
                      {{ SA_GRADES.find(g => g.value === saGrades[currentQuestion?.id ?? -1])?.label }}
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Explanation (MC/TF after answering) -->
              <Transition name="reveal">
                <div v-if="isAnswered && currentQuestion && currentQuestion.type !== 'sa' && 'explanation' in currentQuestion"
                  class="space-y-3">
                  <div class="flex gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/8 px-4 py-3">
                    <UIcon name="i-heroicons-light-bulb" class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p class="text-sm leading-relaxed text-muted">{{ (currentQuestion as any).explanation }}</p>
                  </div>

                  <!-- AI Explain button (for wrong answers) -->
                  <div v-if="!isCorrectAnswer(currentIdx)" class="space-y-2">
                    <button
                      v-if="!aiExplanations[currentQuestion.id] && !isExplaining[currentQuestion.id]"
                      class="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 active:scale-[0.98]"
                      :disabled="!modelAvailable"
                      :title="!modelAvailable ? 'WebGPU not available in this browser' : ''"
                      @click="explainWithAI(currentIdx)"
                    >
                      <UIcon name="i-lucide-sparkles" class="h-3.5 w-3.5" />
                      {{ modelAvailable ? 'Explain this with AI' : 'AI unavailable (no WebGPU)' }}
                    </button>

                    <div v-if="isExplaining[currentQuestion.id]"
                      class="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 animate-spin text-primary shrink-0" />
                      <p class="text-xs text-primary/80">Generating explanation...</p>
                    </div>

                    <div v-if="aiExplanations[currentQuestion.id]"
                      class="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-1.5">
                      <p class="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <UIcon name="i-lucide-sparkles" class="h-3.5 w-3.5" /> AI Explanation
                      </p>
                      <p class="text-sm leading-relaxed text-muted">{{ aiExplanations[currentQuestion.id] }}</p>
                    </div>

                    <p v-if="explainError[currentQuestion.id]" class="text-xs text-red-500 flex items-center gap-1.5">
                      <UIcon name="i-heroicons-exclamation-circle" class="h-3.5 w-3.5 shrink-0" />
                      {{ explainError[currentQuestion.id] }}
                    </p>
                  </div>
                </div>
              </Transition>

            </div>
          </Transition>
        </div>

        <!-- Navigation footer -->
        <div class="sticky bottom-0 border-t border-default bg-default/95 backdrop-blur px-4 py-3">
          <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <button
              class="flex items-center gap-1.5 rounded-xl border border-default px-4 py-2.5 text-sm font-medium text-muted transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="currentIdx === 0"
              @click="prevQuestion"
            >
              <UIcon name="i-heroicons-chevron-left" class="h-4 w-4" /> Back
            </button>

            <!-- Dot nav (up to 15 dots, scrollable) -->
            <div class="flex flex-1 items-center justify-center gap-1 overflow-hidden">
              <button
                v-for="(_, qi) in questions" :key="qi"
                class="shrink-0 rounded-full transition-all duration-200"
                :class="dotClass(qi)"
                @click="goToQuestion(qi)"
              />
            </div>

            <button v-if="currentIdx < questions.length - 1"
              class="flex items-center gap-1.5 rounded-xl border border-default px-4 py-2.5 text-sm font-medium text-muted transition hover:border-primary/50 hover:text-primary"
              @click="nextQuestion"
            >
              Next <UIcon name="i-heroicons-chevron-right" class="h-4 w-4" />
            </button>
            <button v-else
              class="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.97]"
              @click="finishQuiz"
            >
              Finish <UIcon name="i-heroicons-flag" class="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      <!-- REVIEW VIEW -->
      <div v-else-if="view === 'review'" key="review" class="mx-auto max-w-2xl px-4 py-6 space-y-6">

        <!-- Score hero -->
        <div class="overflow-hidden rounded-2xl border border-default">
          <div class="flex flex-col items-center gap-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-8">
            <!-- Score ring -->
            <div class="relative flex h-28 w-28 items-center justify-center">
              <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke-width="8" class="stroke-elevated" />
                <circle cx="50" cy="50" r="44" fill="none" stroke-width="8"
                  :stroke-dasharray="`${score.percentage * 2.76} 276`"
                  :class="score.percentage >= 80 ? 'stroke-green-500' : score.percentage >= 60 ? 'stroke-amber-500' : 'stroke-red-500'"
                  class="transition-all duration-1000" stroke-linecap="round" />
              </svg>
              <div class="text-center">
                <p class="text-3xl font-black text-highlighted">{{ score.percentage }}%</p>
                <p class="text-xs text-muted font-medium">{{ score.correct }}/{{ score.total }}</p>
              </div>
            </div>

            <div class="text-center space-y-1">
              <p class="text-lg font-bold text-highlighted">
                {{ score.percentage >= 80 ? 'Excellent work!' : score.percentage >= 60 ? 'Good effort!' : 'Keep studying!' }}
              </p>
              <p class="text-sm text-muted">{{ score.partial > 0 ? `${score.partial} partial credit` : '' }}</p>
            </div>

            <!-- XP gain -->
            <div class="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <span class="text-base">{{ currentLevel.emoji }}</span>
              <span class="text-sm font-bold text-primary">+{{ xpThisRound }} XP</span>
              <span class="text-xs text-primary/70">→ {{ currentLevel.name }}</span>
            </div>
          </div>
        </div>

        <!-- Chapter breakdown -->
        <div v-if="chapterBreakdown.length > 1" class="rounded-2xl border border-default bg-elevated/30 p-5 space-y-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="h-4 w-4 text-muted" />
            <p class="text-sm font-semibold text-highlighted">Performance by Chapter</p>
          </div>
          <div class="space-y-3">
            <div v-for="cb in chapterBreakdown" :key="cb.chapterId">
              <div class="mb-1 flex items-center justify-between text-xs">
                <span class="flex items-center gap-1.5 font-medium text-muted">
                  <span>{{ cb.emoji }}</span>{{ cb.name }}
                </span>
                <span class="font-bold tabular-nums"
                  :class="cb.pct >= 80 ? 'text-green-500' : cb.pct >= 60 ? 'text-amber-500' : 'text-red-500'">
                  {{ cb.correct }}/{{ cb.total }}
                </span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                <div class="h-full rounded-full transition-all duration-700"
                  :class="cb.pct >= 80 ? 'bg-green-500' : cb.pct >= 60 ? 'bg-amber-500' : 'bg-red-500'"
                  :style="{ width: `${cb.pct}%` }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Per-question review -->
        <div class="overflow-hidden rounded-2xl border border-default">
          <div class="flex items-center gap-2 border-b border-default px-5 py-3">
            <UIcon name="i-heroicons-clipboard-document-list" class="h-4 w-4 text-muted" />
            <p class="text-sm font-semibold text-highlighted">Question Review</p>
          </div>
          <div class="divide-y divide-default">
            <div v-for="(q, qi) in questions" :key="q.id" class="px-5 py-4 space-y-2.5">
              <div class="flex items-start gap-3">
                <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="isCorrectAnswer(qi) ? 'bg-green-500' : 'bg-red-500'">
                  {{ qi + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium leading-snug text-highlighted">{{ q.question }}</p>

                  <!-- MC review options -->
                  <div v-if="q.type === 'mc'" class="mt-2 space-y-1">
                    <div v-for="(opt, oi) in q.options" :key="oi"
                      class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                      :class="reviewMcClass(qi, oi)">
                      <UIcon v-if="oi === q.answer" name="i-heroicons-check-circle-solid" class="h-3.5 w-3.5 shrink-0 text-green-500" />
                      <UIcon v-else-if="oi === answers[qi] && oi !== q.answer" name="i-heroicons-x-circle-solid" class="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span v-else class="h-3.5 w-3.5 shrink-0" />
                      <span>{{ opt }}</span>
                    </div>
                  </div>

                  <!-- TF review -->
                  <div v-else-if="q.type === 'tf'" class="mt-2 text-xs">
                    <span class="rounded-lg px-3 py-1.5" :class="isCorrectAnswer(qi) ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'">
                      You said: {{ answers[qi] ? 'TRUE' : 'FALSE' }} •
                      Correct: {{ q.answer ? 'TRUE' : 'FALSE' }}
                    </span>
                  </div>

                  <!-- SA review -->
                  <div v-else-if="q.type === 'sa'" class="mt-2 text-xs space-y-1.5">
                    <div class="rounded-lg bg-elevated/60 px-3 py-2 text-muted">
                      <span class="font-semibold">Your answer:</span> {{ answers[qi] || '(no answer)' }}
                    </div>
                    <div class="rounded-lg bg-amber-500/8 border border-amber-400/20 px-3 py-2 text-muted">
                      <span class="font-semibold text-amber-600">Key answer:</span> {{ q.answer }}
                    </div>
                    <div v-if="saGrades[q.id]" class="text-muted/70">
                      Self-graded: <span class="font-semibold">{{ saGrades[q.id] }}</span>
                    </div>
                  </div>

                  <!-- Explanation for wrong MC/TF -->
                  <div v-if="!isCorrectAnswer(qi) && q.type !== 'sa' && 'explanation' in q"
                    class="mt-2 flex gap-2 rounded-lg border border-amber-400/20 bg-amber-500/8 px-3 py-2">
                    <UIcon name="i-heroicons-light-bulb" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p class="text-xs leading-relaxed text-muted">{{ (q as any).explanation }}</p>
                  </div>

                  <!-- AI explain in review -->
                  <div v-if="!isCorrectAnswer(qi) && q.type !== 'sa'" class="mt-2">
                    <button v-if="!aiExplanations[q.id] && !isExplaining[q.id]"
                      class="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
                      :disabled="!modelAvailable"
                      @click="explainWithAI(qi)">
                      <UIcon name="i-lucide-sparkles" class="h-3 w-3" />
                      {{ modelAvailable ? 'Explain with AI' : 'No WebGPU' }}
                    </button>
                    <div v-if="isExplaining[q.id]" class="flex items-center gap-1.5 text-xs text-primary/70">
                      <UIcon name="i-heroicons-arrow-path" class="h-3 w-3 animate-spin" />
                      Generating...
                    </div>
                    <div v-if="aiExplanations[q.id]"
                      class="mt-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                      <p class="text-xs leading-relaxed text-muted">
                        <span class="font-semibold text-primary">AI: </span>{{ aiExplanations[q.id] }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-center pb-6">
          <button
            class="flex items-center justify-center gap-2 rounded-xl border border-default px-6 py-3 text-sm font-medium text-muted transition hover:border-primary/50 hover:text-primary"
            @click="resetQuiz">
            <UIcon name="i-heroicons-arrow-path" class="h-4 w-4" /> New Quiz
          </button>
          <button
            class="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.97]"
            @click="handleStart">
            <UIcon name="i-heroicons-play-circle-solid" class="h-4 w-4" /> Retake Same Config
          </button>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  getChapters,
  getFilteredQuestionCount,
  getTotalQuestionCount,
  type McQuestion,
} from '~/composables/useQuestionBank'

const {
  view, questions, currentIdx, answers, saSubmitted, saGrades,
  aiExplanations, isExplaining, explainError,
  currentQuestion, currentAnswer, isAnswered, score, chapterBreakdown,
  xp, xpThisRound, currentLevel, nextLevel, xpToNextLevel,
  chapters, isPreparingQuiz, prepareQuizError,
  selectedChapter, selectedType, selectedDifficulty, questionCount,
  startQuiz, submitMcAnswer, submitTfAnswer, submitSaText, selfGradeSa,
  nextQuestion, prevQuestion, goToQuestion, finishQuiz, resetQuiz, explainWithAI,
  isCorrectAnswer, modelAvailable,
} = useStaticQuiz()

const LETTERS = ['A', 'B', 'C', 'D']
const COUNTS = [5, 10, 15, 20]

const TYPES = [
  { value: 'all' as const, label: 'All' },
  { value: 'mc' as const, label: 'MC' },
  { value: 'tf' as const, label: 'T/F' },
  { value: 'sa' as const, label: 'SA' },
]

const DIFFICULTIES = [
  { value: 'mixed' as const, label: 'Mixed', activeClass: 'border-primary bg-primary/10 text-primary' },
  { value: 'easy' as const, label: 'Easy', activeClass: 'border-green-500 bg-green-500/10 text-green-600' },
  { value: 'medium' as const, label: 'Medium', activeClass: 'border-amber-500 bg-amber-500/10 text-amber-600' },
  { value: 'hard' as const, label: 'Hard', activeClass: 'border-red-500 bg-red-500/10 text-red-600' },
]

const SA_GRADES = [
  { value: 'correct' as const, label: 'Got it!', emoji: '✅', btnClass: 'border-green-400 text-green-600 hover:bg-green-500/10 active:bg-green-500/20' },
  { value: 'partial' as const, label: 'Partial', emoji: '🟡', btnClass: 'border-amber-400 text-amber-600 hover:bg-amber-500/10 active:bg-amber-500/20' },
  { value: 'incorrect' as const, label: 'Missed', emoji: '❌', btnClass: 'border-red-400 text-red-600 hover:bg-red-500/10 active:bg-red-500/20' },
]

// SA text input (local to this component, not persisted)
const saInputText = ref('')
watch(currentIdx, () => { saInputText.value = (answers.value[currentIdx.value] as string) ?? '' })

const totalQuestionCount = ref(0)
const availableCount = ref(0)
const countsLoading = ref(true)
const chapterQuestionCounts = ref<Record<number, number>>({})

function getChapterQuestionCount(chapterId: number) {
  return chapterQuestionCounts.value[chapterId] ?? 0
}

async function refreshCounts() {
  countsLoading.value = true
  try {
    const [total, filtered] = await Promise.all([
      getTotalQuestionCount(null),
      getFilteredQuestionCount({
        chapter: selectedChapter.value,
        type: selectedType.value,
        difficulty: selectedDifficulty.value,
      }),
    ])
    totalQuestionCount.value = total
    availableCount.value = filtered
  } finally {
    countsLoading.value = false
  }
}

async function loadQuizSetupData() {
  chapters.value = await getChapters()
  const chapterCountEntries = await Promise.all(
    chapters.value.map(async ch => [ch.id, await getFilteredQuestionCount({ chapter: ch.id, type: 'all', difficulty: 'mixed' })] as const),
  )
  chapterQuestionCounts.value = Object.fromEntries(chapterCountEntries)
  await refreshCounts()
}

onMounted(async () => {
  await loadQuizSetupData()
})

watch([selectedChapter, selectedType, selectedDifficulty], () => {
  refreshCounts()
})

async function handleStart() {
  saInputText.value = ''
  await startQuiz()
}

const answeredCount = computed(() => answers.value.filter(a => a !== null && a !== undefined).length)

const currentChapterName = computed(() => {
  const ch = chapters.value.find(c => c.id === currentQuestion.value?.chapter)
  return ch?.name ?? 'Unknown'
})

const typeLabel = computed(() => {
  if (!currentQuestion.value) return ''
  return { mc: 'Multiple Choice', tf: 'True / False', sa: 'Short Answer' }[currentQuestion.value.type]
})

const chapterColors: Record<number, string> = {
  1: 'bg-sky-500/10 text-sky-600',
  2: 'bg-violet-500/10 text-violet-600',
  3: 'bg-pink-500/10 text-pink-600',
  4: 'bg-emerald-500/10 text-emerald-600',
  5: 'bg-amber-500/10 text-amber-600',
  6: 'bg-orange-500/10 text-orange-600',
  7: 'bg-red-500/10 text-red-600',
  8: 'bg-indigo-500/10 text-indigo-600',
}

const chapterChipClass = computed(() => chapterColors[currentQuestion.value?.chapter ?? 1] ?? 'bg-primary/10 text-primary')

const difficultyChipClass = computed(() => {
  if (!currentQuestion.value || currentQuestion.value.type !== 'mc') return ''
  const d = (currentQuestion.value as McQuestion).difficulty
  return d === 'easy' ? 'border-green-400/30 text-green-600' : d === 'hard' ? 'border-red-400/30 text-red-600' : 'border-amber-400/30 text-amber-600'
})

const saGradeColor = computed(() => {
  const q = currentQuestion.value
  if (!q || q.type !== 'sa') return ''
  const g = saGrades.value[q.id]
  return g === 'correct' ? 'text-green-600 border-green-400/30' : g === 'partial' ? 'text-amber-600 border-amber-400/30' : 'text-red-600 border-red-400/30'
})

function mcOptionClass(idx: number): string {
  if (!currentQuestion.value || currentQuestion.value.type !== 'mc') return ''
  const q = currentQuestion.value as McQuestion
  const answered = isAnswered.value
  const selected = currentAnswer.value as number | null

  if (!answered) return 'border-default hover:border-primary/60 hover:bg-primary/5 cursor-pointer'
  if (idx === q.answer) return 'border-green-500/60 bg-green-500/[0.07]'
  if (idx === selected) return 'border-red-500/60 bg-red-500/[0.07]'
  return 'border-default opacity-40'
}

function mcLetterClass(idx: number): string {
  if (!currentQuestion.value || currentQuestion.value.type !== 'mc') return ''
  const q = currentQuestion.value as McQuestion
  const answered = isAnswered.value
  const selected = currentAnswer.value as number | null

  if (!answered) return 'bg-elevated border border-default group-hover:border-primary/50 group-hover:text-primary text-muted'
  if (idx === q.answer) return 'bg-green-500 text-white'
  if (idx === selected) return 'bg-red-500 text-white'
  return 'bg-elevated text-muted'
}

function tfOptionClass(val: boolean): string {
  const answered = isAnswered.value
  const selected = currentAnswer.value as boolean | null
  const q = currentQuestion.value

  if (!answered) {
    return val
      ? 'border-default hover:border-blue-400 hover:bg-blue-500/5 cursor-pointer text-muted hover:text-blue-600'
      : 'border-default hover:border-red-400 hover:bg-red-500/5 cursor-pointer text-muted hover:text-red-600'
  }
  const correct = q && q.type === 'tf' ? q.answer : null
  if (val === correct && val === selected) return 'border-green-500 bg-green-500/10 text-green-600'
  if (val === correct) return 'border-green-500 bg-green-500/10 text-green-600'
  if (val === selected && val !== correct) return 'border-red-500 bg-red-500/10 text-red-600'
  return 'border-default opacity-40 text-muted'
}

function dotClass(qi: number): string {
  if (qi === currentIdx.value) return 'h-2.5 w-2.5 bg-primary border-2 border-primary scale-125'
  if (answers.value[qi] !== null && answers.value[qi] !== undefined) {
    return isCorrectAnswer(qi) ? 'h-2 w-2 bg-green-500/70 border border-green-500' : 'h-2 w-2 bg-red-400/70 border border-red-400'
  }
  return 'h-2 w-2 bg-transparent border border-default/60'
}

function reviewMcClass(qi: number, oi: number): string {
  const q = questions.value[qi]
  if (!q || q.type !== 'mc') return ''
  const mc = q as McQuestion
  const userAns = answers.value[qi] as number | null
  if (oi === mc.answer) return 'bg-green-500/10 font-medium text-green-700'
  if (oi === userAns && oi !== mc.answer) return 'bg-red-500/10 text-red-700'
  return 'text-muted'
}
</script>

<style scoped>
.view-enter-active { transition: all 0.2s ease-out; }
.view-leave-active { transition: all 0.15s ease-in; }
.view-enter-from { opacity: 0; transform: translateY(8px); }
.view-leave-to { opacity: 0; transform: translateY(-4px); }

.q-slide-enter-active { transition: all 0.25s ease-out; }
.q-slide-leave-active { transition: all 0.15s ease-in; }
.q-slide-enter-from { opacity: 0; transform: translateX(16px); }
.q-slide-leave-to { opacity: 0; transform: translateX(-8px); }

.reveal-enter-active { transition: all 0.3s ease-out; }
.reveal-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
