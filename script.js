const form = document.querySelector("#briefForm");
const output = document.querySelector("#briefOutput");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = document.querySelector("#projectType").value;
  const style = document.querySelector("#styleTone").value;
  const pages = document.querySelector("#pageCount").value.trim() || "待确认";
  const detail = document.querySelector("#needDetail").value.trim() || "希望深界协助梳理 PPT 代理定制方案。";

  const brief = [
    "深界 PPT 代理定制需求简报",
    "",
    `项目类型：${type}`,
    `目标风格：${style}`,
    `预计页数：${pages}`,
    `重点需求：${detail}`,
    "",
    "希望输出：可复用提示词、页面模板、视觉规范和一版试跑样稿。"
  ].join("\n");

  output.textContent = brief;
  output.classList.add("active");
});
