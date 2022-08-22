/* eslint-disable @typescript-eslint/no-var-requires */
const { exec, spawn } = require("child_process");
const { Parser } = require("minicap");

const UDID = "SET UDID BEFORE RUN";

async function main(udid) {
  this.udid = udid;
  const execPromise = new Promise((resolve, reject) => {
    exec("idb connect " + this.udid, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      console.log(stderr);
      resolve(stdout);
    });
  });
  await execPromise.catch((err) => {
    console.log(err);
  });

  this.proc = spawn("idb", [
    "video-stream",
    "--udid",
    this.udid,
    "--fps", //Seems doesnt work
    "15",
    "--format",
    "minicap",
    "--compression-quality",
    "0.3",
    "--scale-factor",
    (0.5).toString(),
  ]);

  this.proc.stderr.on("data", (stderr) => {
    //console.error('ERR: ' + stderr);
  });

  this.proc.on("exit", (code, signal) => {
    if (code)
      console.warn("Process exited by itself with status code : " + code);
    else console.warn("Process exited with signal  : " + signal);
  });

  this.proc.on("error", (err) => {
    console.error("Process error: " + err);
  });

  this.proc.on("close", (code) => {
    console.log("Status code: " + code);
    if (code == 1)
      console.error(
        `Minicap startup error: Device (${this.udid})  is not found`
      );
    else reject("Minicap startup error. Status: " + code);
  });

  const onBannerAvailable = (banner) => {
    console.log("Banner is available: " + JSON.stringify(banner));
    this.banner = banner;
  };

  const onFrameAvailable = (frame) => {
    if (frameCount == 0) startTime = Date.now();
    console.log("Frame is available: ", ++frameCount);
    // if (this.socket) {
    //   this.socket.emit('image', frame);
    // }
  };

  const parser = new Parser({
    onBannerAvailable,
    onFrameAvailable,
  });

  const tryParse = () => {
    for (let chunk; (chunk = this.proc.stdout.read()); ) {
      parser.parse(chunk);
    }
  };
  this.proc.stdout.on("readable", tryParse);
  tryParse();
}

let frameCount = 0;
let startTime = 0; // Set when banner available
main(UDID);

function calculateAverageFps() {
  const endTime = Date.now();
  const sec = (endTime - startTime) / 1000;
  console.log("AverageFps: ", frameCount / sec);
}

process.on("SIGINT", calculateAverageFps);
process.on("SIGTERM", calculateAverageFps);
