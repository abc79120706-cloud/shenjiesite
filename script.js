const animatedItems = document.querySelectorAll("[data-animate]");

const showAllAnimatedItems = () => {
  animatedItems.forEach((item) => item.classList.add("is-visible"));
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px 120px 0px" }
  );

  animatedItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`;
    revealObserver.observe(item);
  });

  window.setTimeout(showAllAnimatedItems, 1400);
} else {
  showAllAnimatedItems();
}

const form = document.querySelector("#briefForm");
const output = document.querySelector("#briefOutput");

if (form && output) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const type = document.querySelector("#projectType").value;
    const service = document.querySelector("#serviceType").value;
    const style = document.querySelector("#styleTone").value;
    const pages = document.querySelector("#pageCount").value.trim() || "待确认";
    const deadline = document.querySelector("#deadline").value.trim() || "待确认";
    const detail =
      document.querySelector("#needDetail").value.trim() ||
      "希望深界协助评估 PPT 定制与美化方案。";

    const brief = [
      "深界 PPT 定制与美化需求简报",
      "",
      `PPT 类型：${type}`,
      `服务需求：${service}`,
      `目标风格：${style}`,
      `预计页数：${pages}`,
      `截止时间：${deadline}`,
      `重点需求：${detail}`,
      "",
      "希望输出：可编辑 PPTX、PDF 预览、风格建议，并根据内容情况提供版式与图表优化。"
    ].join("\n");

    output.textContent = brief;
    output.classList.add("active");
  });
}
