import Alpine from "alpinejs";
import CTFd from "./index";
import { getOption } from "./utils/graphs/echarts/scoreboard";
import { embed, dispose } from "./utils/graphs/echarts";
import { scoreboardState } from "./utils/scoreboard-state";

window.Alpine = Alpine;
window.CTFd = CTFd;

// Default scoreboard polling interval to every 5 minutes
const scoreboardUpdateInterval = window.scoreboardUpdateInterval || 300000;

Alpine.data("ScoreboardDetail", () => ({
  ...scoreboardState(),
  data: {},
  activeBracket: null,
  dataBracket: null,
  pollTimer: null,

  get hasCurrentData() {
    return this.loaded && this.dataBracket === this.activeBracket;
  },

  get hasScores() {
    return this.hasCurrentData && Object.keys(this.data).length > 0;
  },

  update() {
    const bracket = this.activeBracket;
    return this.request(
      () => CTFd.pages.scoreboard.getScoreboardDetail(10, bracket),
      async (data, isCurrent) => {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new Error("Invalid scoreboard response");
        }
        const option = getOption(
          CTFd.config.userMode,
          data,
          window.scoreboardChartOptions,
        );
        this.data = data;
        this.dataBracket = bracket;
        this.loaded = true;
        // The pinned Alpine version uses a callback, not a returned Promise.
        // Wait until x-show has exposed the chart before measuring its canvas.
        await new Promise(resolve => this.$nextTick(resolve));
        // Alpine's x-show also schedules visibility on the next paint frame.
        await new Promise(resolve => {
          if (document.visibilityState === "visible") requestAnimationFrame(resolve);
          else setTimeout(resolve);
        });
        if (isCurrent() && this.hasScores) embed(this.$refs.scoregraph, option);
      },
    );
  },

  init() {
    this.update();
    this.pollTimer = setInterval(() => {
      if (!this.loading) this.update();
    }, scoreboardUpdateInterval);
  },

  destroy() {
    clearInterval(this.pollTimer);
    this.cancelRequest();
    dispose(this.$refs.scoregraph);
  },
}));

Alpine.data("ScoreboardList", () => ({
  ...scoreboardState(),
  standings: [],
  brackets: [],
  activeBracket: null,
  pollTimer: null,

  get visibleStandings() {
    return this.standings.filter(i =>
      this.activeBracket ? i.bracket_id == this.activeBracket : true,
    );
  },

  update() {
    return this.request(
      () =>
        Promise.all([
          CTFd.pages.scoreboard.getBrackets(CTFd.config.userMode),
          CTFd.pages.scoreboard.getScoreboard(),
        ]),
      ([brackets, standings]) => {
        if (!Array.isArray(brackets) || !Array.isArray(standings)) {
          throw new Error("Invalid standings response");
        }
        this.brackets = brackets;
        this.standings = standings;
      },
    );
  },

  init() {
    this.$watch("activeBracket", value => {
      this.$dispatch("bracket-change", value);
    });

    this.update();

    this.pollTimer = setInterval(() => {
      if (!this.loading) this.update();
    }, scoreboardUpdateInterval);
  },

  destroy() {
    clearInterval(this.pollTimer);
    this.cancelRequest();
  },
}));

Alpine.start();
