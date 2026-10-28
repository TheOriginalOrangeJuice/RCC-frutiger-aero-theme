import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
} from "echarts/components";
// Features like Universal Transition and Label Layout
import { LabelLayout, UniversalTransition } from "echarts/features";
// Import the Canvas renderer
// Note that introducing the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from "echarts/renderers";

// Register the required components
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

const resizeHandlers = new WeakMap();
const resizeObservers = new WeakMap();

export function embed(target, option) {
  const chart = echarts.getInstanceByDom(target) || echarts.init(target);

  // https://echarts.apache.org/en/api.html#echartsInstance.setOption
  // https://github.com/apache/echarts/issues/6202#issuecomment-315054637
  // https://stackoverflow.com/a/72211534
  chart.setOption(option, true);

  chart.resize();
  if (!resizeHandlers.has(target)) {
    const resize = () => echarts.getInstanceByDom(target)?.resize();
    resizeHandlers.set(target, resize);
    window.addEventListener("resize", resize);
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (target.clientWidth && target.clientHeight) resize();
      });
      observer.observe(target);
      resizeObservers.set(target, observer);
    }
  }
  return chart;
}

export function dispose(target) {
  if (!target) return;
  const resize = resizeHandlers.get(target);
  if (resize) window.removeEventListener("resize", resize);
  resizeHandlers.delete(target);
  resizeObservers.get(target)?.disconnect();
  resizeObservers.delete(target);
  echarts.getInstanceByDom(target)?.dispose();
}
