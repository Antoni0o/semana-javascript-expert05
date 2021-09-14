import {
  describe,
  test,
  beforeEach,
  beforeAll,
  afterAll,
  expect,
  jest,
} from "@jest/globals";
import fs from "fs";
import FormData from "form-data";
import { tmpdir } from "os";
import { join } from "path";
import { logger } from "../../src/logger.js";
import Routes from "../../src/routes.js";
import TestUtil from "../utils/testUtil.js";

describe("#Routes Integration Test", () => {
  let defaultDownloadsFolder = "";
  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(
      join(tmpdir(), "dowloads-")
    );
  });

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });
  describe("#GetFileStatus", () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => {},
    };

    test("should upload file to the folder", async () => {
      const filename = "wallpaper.jpg",
        fileStream = fs.createReadStream(
          `./test/integration/mocks/${filename}`
        ),
        res = TestUtil.genereateWritableStream(() => {});

      const form = new FormData();
      form.append("photo", fileStream);

      const defaultParams = {
        req: Object.assign(form, {
          headers: form.getHeaders(),
          method: "POST",
          url: "?socketId=10",
        }),
        res: Object.assign(res, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams),
      };

      const routes = new Routes(defaultDownloadsFolder);

      routes.setSocketInstance(ioObj);

      const dirBeforeRun = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirBeforeRun).toEqual([]);

      await routes.handler(...defaultParams.values());

      const dirAfterRun = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirAfterRun).toEqual([filename]);

      expect(defaultParams.res.writeHead).toHaveBeenCalledWith(200);

      const expectedResult = JSON.stringify({
        result: "Files uploaded succesfully!",
      });
      expect(defaultParams.res.end).toHaveBeenCalledWith(expectedResult);
    });
  });
});
