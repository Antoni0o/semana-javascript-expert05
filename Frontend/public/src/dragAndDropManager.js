export default class DragAndDropManager {
  constructor() {
    this.dropArea = document.getElementById("dropArea");
    this.onDropHandler = () => {};
  }

  initialize({ onDropHandler }) {
    this.onDropHandler = onDropHandler;

    this.disableDragAndDropEvents();
    this.enableHighlightOnDrag();
    this.enableDrop();
  }

  disableDragAndDropEvents() {
    const events = ["dragenter", "dragover", "dragleave", "drop"];

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    events.forEach((eventName) => {
      this.dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
  }

  enableHighlightOnDrag() {
    const events = ["dragenter", "dragover"];
    const hightlight = (e) => {
      this.dropArea.classList.add("hightlight");
      this.dropArea.classList.add("drop-area");
    };

    events.forEach((eventName) => {
      this.dropArea.addEventListener(eventName, hightlight, false);
    });
  }

  enableDrop(e) {
    const drop = (e) => {
      this.dropArea.classList.remove("drop-area");

      const files = e.dataTransfer.files;
      return this.onDropHandler(files);
    };

    this.dropArea.addEventListener("drop", drop, false);
  }
}
