import { jest } from "@jest/globals";
import fs from "fs";
import FileHelper from "../../src/fileHelper.js";
import Routes from "../../src/routes.js";

describe("#File Helper", () => {
  describe("#getFileStatus", () => {
    test("it should return files statuses in correct format", async () => {
      const statMock = {
        dev: 2055,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 13897046,
        size: 67298,
        blocks: 136,
        atimeMs: 1631024796253.9438,
        mtimeMs: 1631024796057.9412,
        ctimeMs: 1631024796057.9412,
        birthtimeMs: 1631024796057.9412,
        atime: "2021-09-07T14:26:36.254Z",
        mtime: "2021-09-07T14:26:36.058Z",
        ctime: "2021-09-07T14:26:36.058Z",
        birthtime: "2021-09-07T14:26:36.058Z",
      };

      const mockUser = "antonio";
      process.env.USER = mockUser;
      const filename = "file.png";
      
      jest
        .spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([ filename ]);

      jest
        .spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock);
      
      const result = await FileHelper.getFileStatus('/tmp')

      const expectedResult = [
        {
          size: "67.3 kB",
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: filename,
        },
      ];

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
      expect(result).toMatchObject(expectedResult)
    });
  });
});
