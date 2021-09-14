export default class ConnectionManager {
  constructor({ apiUrl }) {
    this.apiUrl = apiUrl;

    this.ioClient = io.connect(apiUrl, { withCredentials: false });
    this.socketId = "";
  }

  configureEvents({ onProgress }) {
    this.ioClient.on('connect', this.onConnect.bind(this))
    this.ioClient.on('file-upload', onProgress)
  }

  onConnect() {
    console.log("connected!", this.ioClient.id);
    this.socketId;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
      method: "POST",
      body: formData,
    });

    return res.json();
  }

  async currentFiles() {
    const files = (await (await fetch(this.apiUrl)).json());
    return files;
  }
}
