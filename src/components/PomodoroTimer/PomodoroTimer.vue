<template>
  <div class="pomodoro-timer">
    <!-- 初始状态 -->
    <div v-if="!isActive" class="timer-start-screen">
      <img src="@/assets/logo.png" alt="番茄时钟" class="pomodoro-logo" />
      <h2 class="timer-title">番茄时钟</h2>
      <p class="timer-subtitle">专注 · 高效 · 平衡</p>
      <div class="encouragement-card">
        <div class="quote-icon">"</div>
        <p class="encouragement-text">{{ currentEncouragement }}</p>
      </div>
      <button @click="startTimer" class="start-button" :disabled="isLoading">
        <span v-if="isLoading" class="loading-spinner-small"></span>
        <span v-else>{{ isLoading ? "准备中..." : "开始专注" }}</span>
      </button>
    </div>

    <!-- 激活状态 -->
    <div v-else class="timer-active-screen">
      <!-- 顶部模式指示器 -->
      <div class="mode-indicator" :class="modeClass">
        <span class="mode-dot"></span>
        <span class="mode-text">{{ timerModeText }}</span>
      </div>

      <!-- 圆形计时器 -->
      <div class="circular-timer">
        <!-- 外圈光环效果 -->
        <div class="timer-halo" :class="modeClass"></div>

        <!-- 计时数字 -->
        <div class="timer-display">
          <div class="timer-digits">{{ formattedTime }}</div>
          <div class="timer-label">{{ isBreak ? "休息时间" : "专注时间" }}</div>
        </div>

        <!-- 进度环 -->
        <svg class="progress-ring" width="280" height="280">
          <defs>
            <linearGradient
              id="gradient-focus"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" :stop-color="gradientStart" />
              <stop offset="100%" :stop-color="gradientEnd" />
            </linearGradient>
            <linearGradient
              id="gradient-break"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#63e6be" />
              <stop offset="100%" stop-color="#96f2d7" />
            </linearGradient>
          </defs>
          <circle class="progress-ring-background" cx="140" cy="140" r="130" />
          <circle
            class="progress-ring-fill"
            cx="140"
            cy="140"
            r="130"
            :stroke="isBreak ? 'url(#gradient-break)' : 'url(#gradient-focus)'"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
          />
        </svg>
      </div>

      <!-- 当前鼓励语 -->
      <div class="current-encouragement">
        <p>{{ currentEncouragement }}</p>
      </div>

      <!-- 控制按钮组 -->
      <div class="control-buttons">
        <button
          v-if="!isPaused && !isBreak"
          @click="pauseTimer"
          class="control-button pause-button"
        >
          <span class="button-icon"></span>
          <span class="button-text">暂停</span>
        </button>
        <button
          v-if="isPaused && !isBreak"
          @click="resumeTimer"
          class="control-button resume-button"
        >
          <span class="button-icon"></span>
          <span class="button-text">继续</span>
        </button>
        <button @click="stopTimer" class="control-button stop-button">
          <span class="button-icon"></span>
          <span class="button-text">终止</span>
        </button>

        <!-- 休息跳过按钮 -->
        <button
          v-if="isBreak && !isPaused"
          @click="skipBreak"
          class="control-button skip-button"
        >
          <span class="button-icon">⏭️</span>
          <span class="button-text">跳过休息</span>
        </button>
      </div>

      <!-- 统计数据 -->
      <div class="stats-panel">
        <div class="stat-item">
          <div class="stat-content">
            <div class="stat-value">{{ completedSessions }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-content">
            <div class="stat-value">{{ formatStatsTime(totalFocusTime) }}</div>
            <div class="stat-label">总专注</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 暂停模态框 -->
    <div v-if="showPauseModal" class="modal-container">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-icon"></div>
          <h3 class="modal-title">暂停中</h3>
        </div>
        <div class="modal-body">
          <p class="modal-message">
            暂停限制时长为3分钟，避免过长的打断影响专注流程。
          </p>
          <div class="pause-timer">
            <div class="pause-progress" :style="pauseProgressStyle"></div>
            <div class="pause-time">{{ formatTime(pauseTimeLeft) }}</div>
          </div>
        </div>
        <button @click="resumeTimer" class="modal-action-button">
          立即继续专注
        </button>
      </div>
    </div>

    <!-- 跳过休息确认框 -->
    <div v-if="showSkipConfirm" class="modal-container">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-icon"></div>
          <h3 class="modal-title">跳过休息？</h3>
        </div>
        <div class="modal-body">
          <p class="modal-message">
            确定要跳过休息时间，立即开始下一轮专注吗？
          </p>
        </div>
        <div class="modal-actions">
          <button @click="confirmSkip" class="modal-button confirm-button">
            是的，继续专注
          </button>
          <button @click="cancelSkip" class="modal-button cancel-button">
            继续休息
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 鼓励话语语料库
const ENCOURAGEMENTS = [
  "行远自迩，笃行不怠",
  "焚膏继晷，兀兀穷年",
  "怀瑾握瑜，风禾尽起",
  "尽小者大，慎微者著",
  "浮舟沧海，立马昆仑",
  "流水不争先，争的是滔滔不绝",
  "想，全是问题；做，才有答案",
  "百舸争流，奋楫者先",
  "青矜之志，履践致远",
  "为者常成，行者常至",
  "马行千里，不洗尘沙",
  "日拱一卒，功不唐捐",
  "与其抱怨天黑，不如提灯前行",
  "站在山顶的人，不会嘲笑半山腰的攀登者",
  "把行动交给现在，把结果交给时间",
  "向下扎根，向上生花",
  "追风赶月莫停留，平芜尽处是春山",
];

export default {
  name: "PomodoroTimer",
  props: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 计时器状态
      isActive: false,
      isPaused: false,
      isBreak: false,
      isLoading: false,

      // 时间设置（秒）
      focusTime: 25 * 60,
      breakTime: 5 * 60,
      maxPauseTime: 3 * 60,

      // 当前时间
      timeLeft: 25 * 60,
      pauseTimeLeft: 3 * 60,

      // 计时器引用
      timer: null,
      pauseTimerRef: null,

      // 统计数据
      completedSessions: 0,
      totalFocusTime: 0,

      // 弹窗控制
      showPauseModal: false,
      showSkipConfirm: false,

      // 随机鼓励语
      currentEncouragement: "",
      encouragements: [...ENCOURAGEMENTS],

      // 清爽的橘黄红色渐变
      gradientStart: "#ffa94d", // 更淡的橙色
      gradientEnd: "#ff8787", // 更淡的珊瑚红
    };
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    },

    timerModeText() {
      if (this.isBreak) return "休息时间";
      if (this.isPaused) return "已暂停";
      return "专注时间";
    },

    modeClass() {
      if (this.isBreak) return "mode-break";
      if (this.isPaused) return "mode-pause";
      return "mode-focus";
    },

    circumference() {
      return 2 * Math.PI * 130; // 更新为130
    },

    progressOffset() {
      const totalTime = this.isBreak ? this.breakTime : this.focusTime;
      const progress = this.timeLeft / totalTime;
      return this.circumference * (1 - progress);
    },

    pauseProgressStyle() {
      const progress = (this.pauseTimeLeft / this.maxPauseTime) * 100;
      return { width: `${progress}%` };
    },
  },
  watch: {
    active(newVal) {
      if (newVal && !this.isActive) {
        this.startTimer();
      }
    },
  },
  mounted() {
    this.pickRandomEncouragement();
  },
  beforeUnmount() {
    this.clearTimers();
  },
  methods: {
    pickRandomEncouragement() {
      const randomIndex = Math.floor(
        Math.random() * this.encouragements.length
      );
      this.currentEncouragement = this.encouragements[randomIndex];
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },

    formatStatsTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    },

    startTimer() {
      this.isLoading = true;

      setTimeout(() => {
        this.isActive = true;
        this.isBreak = false;
        this.isPaused = false;
        this.timeLeft = this.focusTime;
        this.pickRandomEncouragement();
        this.startCountdown();
        this.isLoading = false;
        this.$emit("timer-started");
        this.$emit("user-status-change", "focusing"); // 通知状态变为专注
      }, 300);
    },

    startCountdown() {
      this.clearTimers();

      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
          if (!this.isBreak && !this.isPaused) {
            this.totalFocusTime++;
          }
        } else {
          this.handleTimerEnd();
        }
      }, 1000);
    },

    // 处理计时器结束的完整逻辑
    handleTimerEnd() {
      if (this.isBreak) {
        this.startFocusSession(); // 调用重命名后的方法
      } else {
        this.startBreakSession(); // 调用重命名后的方法
      }
    },

    // 重命名为避免重复
    startBreakSession() {
      this.completedSessions++;
      this.isBreak = true;
      this.timeLeft = this.breakTime;
      this.pickRandomEncouragement();
      this.$emit("focus-completed", this.completedSessions);
      this.$emit("user-status-change", "resting"); // 专注完成进入休息
    },

    // 重命名为避免重复
    startFocusSession() {
      this.isBreak = false;
      this.timeLeft = this.focusTime;
      this.pickRandomEncouragement();
      // 休息结束，自动开始新的专注
      this.$emit("timer-started");
    },

    pauseTimer() {
      this.isPaused = true;
      this.showPauseModal = true;
      this.pauseTimeLeft = this.maxPauseTime;

      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      this.startPauseCountdown();
      this.$emit("timer-paused");
      // 注意：暂停时状态仍然是专注，只是暂停了，所以不改变状态
    },

    startPauseCountdown() {
      this.pauseTimerRef = setInterval(() => {
        if (this.pauseTimeLeft > 0) {
          this.pauseTimeLeft--;
        } else {
          this.resumeTimer();
        }
      }, 1000);
    },

    resumeTimer() {
      this.isPaused = false;
      this.showPauseModal = false;

      if (this.pauseTimerRef) {
        clearInterval(this.pauseTimerRef);
        this.pauseTimerRef = null;
      }

      this.startCountdown();
      this.$emit("timer-resumed");
      this.$emit("user-status-change", "focusing"); // 恢复时状态变为专注
    },

    stopTimer() {
      if (confirm("确定要终止当前的专注吗？")) {
        this.clearTimers();
        this.resetTimer();
        this.$emit("timer-stopped");
        this.$emit("user-status-change", "resting"); // 终止时状态变为休息
      }
    },

    skipBreak() {
      this.showSkipConfirm = true;
    },

    confirmSkip() {
      this.showSkipConfirm = false;
      this.startFocusSession(); // 调用重命名后的方法
      this.$emit("break-skipped");
      this.$emit("user-status-change", "focusing"); // 跳过休息时状态变为专注
    },

    cancelSkip() {
      this.showSkipConfirm = false;
    },

    resetTimer() {
      this.isActive = false;
      this.isPaused = false;
      this.isBreak = false;
      this.timeLeft = this.focusTime;
      this.pauseTimeLeft = this.maxPauseTime;
      this.showPauseModal = false;
      this.showSkipConfirm = false;
    },

    clearTimers() {
      if (this.timer) clearInterval(this.timer);
      if (this.pauseTimerRef) clearInterval(this.pauseTimerRef);
      this.timer = null;
      this.pauseTimerRef = null;
    },
  },
};
</script>

<style scoped>
/* 基础容器 - 修改：移除最大宽度，填满容器 */
.pomodoro-timer {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px; /* 增大内边距 */
  width: 100%; /* 填满父容器 */
  min-height: 550px; /* 增加高度 */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
  display: flex; /* flex布局填满高度 */
  flex-direction: column;
}

/* 微妙的背景纹理 */
.pomodoro-timer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
      circle at 20% 30%,
      rgba(255, 169, 77, 0.03) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(255, 135, 135, 0.03) 0%,
      transparent 50%
    );
  pointer-events: none;
  z-index: 0;
}

/* 所有内容都在上面 */
.timer-start-screen,
.timer-active-screen {
  position: relative;
  z-index: 1;
  flex: 1; /* 填满容器高度 */
  display: flex;
  flex-direction: column;
}

/* 初始界面 */
.timer-start-screen {
  text-align: center;
  justify-content: center; /* 垂直居中 */
}

.pomodoro-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  object-fit: contain;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 6px 12px rgba(255, 169, 77, 0.25));
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.timer-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffa94d 0%, #ff8787 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.timer-subtitle {
  color: #8a8a8a;
  font-size: 15px;
  margin: 0 0 28px 0;
  font-weight: 400;
}

.encouragement-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  margin: 20px 0 28px;
  position: relative;
  border: 1px solid #e9ecef;
}

.quote-icon {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 20px;
  color: #ffa94d;
  opacity: 0.4;
}

.encouragement-text {
  color: #495057;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  font-style: italic;
  font-weight: 500;
}

.start-button {
  background: linear-gradient(135deg, #ffa94d 0%, hsl(42, 85%, 61%) 100%);
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.start-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 169, 77, 0.25);
}

.start-button:active:not(:disabled) {
  transform: translateY(0);
}

.start-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner-small {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 激活界面 */
.timer-active-screen {
  position: relative;
}

.mode-indicator {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 18px;
  margin-bottom: 20px;
  font-size: 13px;
  font-weight: 500;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.mode-indicator.mode-focus {
  color: #ffa94d;
}

.mode-indicator.mode-break {
  color: #63e6be;
}

.mode-indicator.mode-pause {
  color: #ffc078;
}

.mode-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.mode-focus .mode-dot {
  background: #ffa94d;
}
.mode-break .mode-dot {
  background: #63e6be;
}
.mode-pause .mode-dot {
  background: #ffc078;
}

/* 圆形计时器 - 增大尺寸 */
.circular-timer {
  position: relative;
  width: 280px; /* 从220px增大到280px */
  height: 280px;
  margin: 0 auto 28px;
}

.timer-halo {
  position: absolute;
  top: -15px;
  left: -15px;
  right: -15px;
  bottom: -15px;
  border-radius: 50%;
  opacity: 0.15;
  z-index: 0;
}

.timer-halo.mode-focus {
  background: #ffa94d;
}
.timer-halo.mode-break {
  background: #63e6be;
}

.timer-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}

.timer-digits {
  font-size: 52px; /* 从44px增大到52px */
  font-weight: 700;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color: hwb(32 47% 4%);
  letter-spacing: -1px;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.timer-label {
  font-size: 14px;
  color: #868e96;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.progress-ring {
  width: 280px; /* 与容器一致 */
  height: 280px;
  transform: rotate(-90deg);
}

.progress-ring-background {
  fill: none;
  stroke: #f1f3f5;
  stroke-width: 10;
}

.progress-ring-fill {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
  opacity: 0.6;
}

/* 鼓励语 */
.current-encouragement {
  margin: 20px 0 28px;
  padding: 14px;
  background: #f8f9fa;
  border-radius: 14px;
  border: 1px solid #e9ecef;
  flex-shrink: 0; /* 防止被压缩 */
}

.current-encouragement p {
  margin: 0;
  color: #495057;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  line-height: 1.5;
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 20px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  background: white;
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.pause-button {
  background: white;
  color: #ffa94d;
  border-color: #ffe8cc;
}

.pause-button:hover {
  background: #fff9f2;
  border-color: #ffa94d;
}

.resume-button {
  background: white;
  color: #63e6be;
  border-color: #d3f9d8;
}

.resume-button:hover {
  background: #f3fef9;
  border-color: #63e6be;
}

.stop-button {
  background: white;
  color: #ff8787;
  border-color: #ffd8d8;
}

.stop-button:hover {
  background: #fff5f5;
  border-color: #ff8787;
}

.skip-button {
  background: white;
  color: #9775fa;
  border-color: #e5dbff;
}

.skip-button:hover {
  background: #f8f9ff;
  border-color: #9775fa;
}

/* 统计数据 */
.stats-panel {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding-top: 20px;
  border-top: 1px solid #f1f3f5;
  margin-top: auto; /* 推到容器底部 */
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28px; /* 从24px增大到28px */
  font-weight: 700;
  color: #212529;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 15px; /* 从14px增大到15px */
  color: #868e96;
}

/* 模态框 */
.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.3s ease;
  border: 1px solid #f0f0f0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.modal-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
  margin: 0;
}

.modal-body {
  margin-bottom: 20px;
}

.modal-message {
  color: #495057;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 12px 0;
  text-align: center;
}

.modal-tip {
  color: #868e96;
  font-size: 13px;
  text-align: center;
  margin: 0;
  font-style: italic;
}

.pause-timer {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 14px;
  margin-top: 12px;
  position: relative;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.pause-progress {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(90deg, #ffc078 0%, #ffd8a8 100%);
  transition: width 1s linear;
  opacity: 0.7;
}

.pause-time {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #212529;
}

.modal-action-button,
.modal-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-action-button {
  background: linear-gradient(135deg, #ffa94d 0%, #ff8787 100%);
  color: white;
}

.modal-action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 169, 77, 0.25);
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.modal-button {
  flex: 1;
}

.confirm-button {
  background: linear-gradient(135deg, #63e6be 0%, #96f2d7 100%);
  color: white;
  border: none;
}

.cancel-button {
  background: white;
  color: #495057;
  border: 1px solid #dee2e6;
}

.confirm-button:hover,
.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pomodoro-timer {
    padding: 20px;
    min-height: 500px;
  }

  .circular-timer {
    width: 240px;
    height: 240px;
  }

  .progress-ring {
    width: 240px;
    height: 240px;
  }

  .progress-ring-background,
  .progress-ring-fill {
    cx: 120;
    cy: 120;
    r: 110;
  }

  .timer-digits {
    font-size: 44px;
  }

  .control-button {
    min-width: 110px;
    padding: 10px 16px;
  }

  .modal-card {
    padding: 24px;
  }
}
</style>

<style scoped>
/* 基础容器 - 修改：移除最大宽度，填满容器 */
.pomodoro-timer {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px; /* 增大内边距 */
  width: 100%; /* 填满父容器 */
  min-height: 550px; /* 增加高度 */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
  display: flex; /* flex布局填满高度 */
  flex-direction: column;
}

/* 微妙的背景纹理 */
.pomodoro-timer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
      circle at 20% 30%,
      rgba(255, 169, 77, 0.03) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(255, 135, 135, 0.03) 0%,
      transparent 50%
    );
  pointer-events: none;
  z-index: 0;
}

/* 所有内容都在上面 */
.timer-start-screen,
.timer-active-screen {
  position: relative;
  z-index: 1;
  flex: 1; /* 填满容器高度 */
  display: flex;
  flex-direction: column;
}

/* 初始界面 */
.timer-start-screen {
  text-align: center;
  justify-content: center; /* 垂直居中 */
}

.pomodoro-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  object-fit: contain;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 6px 12px rgba(255, 169, 77, 0.25));
  align-self: center; /* 确保图片自身居中 */
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.timer-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffa94d 0%, #ff8787 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.timer-subtitle {
  color: #8a8a8a;
  font-size: 15px;
  margin: 0 0 28px 0;
  font-weight: 400;
}

.encouragement-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  margin: 20px 0 28px;
  position: relative;
  border: 1px solid #e9ecef;
}

.quote-icon {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 20px;
  color: #ffa94d;
  opacity: 0.4;
}

.encouragement-text {
  color: #495057;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  font-style: italic;
  font-weight: 500;
}

.start-button {
  background: linear-gradient(135deg, #ffa94d 0%, hsl(42, 85%, 61%) 100%);
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.start-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 169, 77, 0.25);
}

.start-button:active:not(:disabled) {
  transform: translateY(0);
}

.start-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner-small {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 激活界面 */
.timer-active-screen {
  position: relative;
}

.mode-indicator {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 18px;
  margin-bottom: 20px;
  font-size: 13px;
  font-weight: 500;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.mode-indicator.mode-focus {
  color: #ffa94d;
}

.mode-indicator.mode-break {
  color: #63e6be;
}

.mode-indicator.mode-pause {
  color: #ffc078;
}

.mode-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.mode-focus .mode-dot {
  background: #ffa94d;
}
.mode-break .mode-dot {
  background: #63e6be;
}
.mode-pause .mode-dot {
  background: #ffc078;
}

/* 圆形计时器 - 增大尺寸 */
.circular-timer {
  position: relative;
  width: 280px; /* 从220px增大到280px */
  height: 280px;
  margin: 0 auto 28px;
}

.timer-halo {
  position: absolute;
  top: -15px;
  left: -15px;
  right: -15px;
  bottom: -15px;
  border-radius: 50%;
  opacity: 0.15;
  z-index: 0;
}

.timer-halo.mode-focus {
  background: #ffa94d;
}
.timer-halo.mode-break {
  background: #63e6be;
}

.timer-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}

.timer-digits {
  font-size: 52px; /* 从44px增大到52px */
  font-weight: 700;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color: hwb(32 47% 4%);
  letter-spacing: -1px;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.timer-label {
  font-size: 14px;
  color: #868e96;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.progress-ring {
  width: 280px; /* 与容器一致 */
  height: 280px;
  transform: rotate(-90deg);
}

.progress-ring-background {
  fill: none;
  stroke: #f1f3f5;
  stroke-width: 10;
}

.progress-ring-fill {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
  opacity: 0.6;
}

/* 鼓励语 */
.current-encouragement {
  margin: 20px 0 28px;
  padding: 14px;
  background: #f8f9fa;
  border-radius: 14px;
  border: 1px solid #e9ecef;
  flex-shrink: 0; /* 防止被压缩 */
}

.current-encouragement p {
  margin: 0;
  color: #495057;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  line-height: 1.5;
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 20px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  background: white;
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.pause-button {
  background: white;
  color: #ffa94d;
  border-color: #ffe8cc;
}

.pause-button:hover {
  background: #fff9f2;
  border-color: #ffa94d;
}

.resume-button {
  background: white;
  color: #63e6be;
  border-color: #d3f9d8;
}

.resume-button:hover {
  background: #f3fef9;
  border-color: #63e6be;
}

.stop-button {
  background: white;
  color: #ff8787;
  border-color: #ffd8d8;
}

.stop-button:hover {
  background: #fff5f5;
  border-color: #ff8787;
}

.skip-button {
  background: white;
  color: #9775fa;
  border-color: #e5dbff;
}

.skip-button:hover {
  background: #f8f9ff;
  border-color: #9775fa;
}

/* 统计数据 */
.stats-panel {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding-top: 20px;
  border-top: 1px solid #f1f3f5;
  margin-top: auto; /* 推到容器底部 */
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28px; /* 从24px增大到28px */
  font-weight: 700;
  color: #212529;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 15px; /* 从14px增大到15px */
  color: #868e96;
}

/* 模态框 */
.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.3s ease;
  border: 1px solid #f0f0f0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.modal-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
  margin: 0;
}

.modal-body {
  margin-bottom: 20px;
}

.modal-message {
  color: #495057;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 12px 0;
  text-align: center;
}

.modal-tip {
  color: #868e96;
  font-size: 13px;
  text-align: center;
  margin: 0;
  font-style: italic;
}

.pause-timer {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 14px;
  margin-top: 12px;
  position: relative;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.pause-progress {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(90deg, #ffc078 0%, #ffd8a8 100%);
  transition: width 1s linear;
  opacity: 0.7;
}

.pause-time {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #212529;
}

.modal-action-button,
.modal-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-action-button {
  background: linear-gradient(135deg, #ffa94d 0%, #ff8787 100%);
  color: white;
}

.modal-action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 169, 77, 0.25);
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.modal-button {
  flex: 1;
}

.confirm-button {
  background: linear-gradient(135deg, #63e6be 0%, #96f2d7 100%);
  color: white;
  border: none;
}

.cancel-button {
  background: white;
  color: #495057;
  border: 1px solid #dee2e6;
}

.confirm-button:hover,
.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pomodoro-timer {
    padding: 20px;
    min-height: 500px;
  }

  .circular-timer {
    width: 240px;
    height: 240px;
  }

  .progress-ring {
    width: 240px;
    height: 240px;
  }

  .progress-ring-background,
  .progress-ring-fill {
    cx: 120;
    cy: 120;
    r: 110;
  }

  .timer-digits {
    font-size: 44px;
  }

  .control-button {
    min-width: 110px;
    padding: 10px 16px;
  }

  .modal-card {
    padding: 24px;
  }
}
</style>
