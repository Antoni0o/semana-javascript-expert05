import { jest } from "@jest/globals";
import { logger } from "../../src/logger.js";
import Routes from "../../src/routes.js";
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../utils/testUtil.js";

describe("#Routes test suite", () => {
  beforeEach(() => {
    jest.spyOn(logger, 'info')
        .mockImplementation()
  })
  const req = TestUtil.generateReadableStream(['something like a file']),
        res = TestUtil.genereateWritableStream(() => {})
  
  const defaultParams = {
    req: Object.assign(req, {
      headers: {
        "Content-type": "multipart/form-data",
      },
      method: "",
      body: {},
    }),
    res: Object.assign(res, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
    values: () => Object.values(defaultParams),
  };
  
  describe("#SetSocketInstance", () => {
    test("setSocketInstance should store Io instance", () => {
      const routes = new Routes();
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {},
      };

      routes.setSocketInstance(ioObj);
      expect(routes.io).toStrictEqual(ioObj);
    });
  });

  describe("#handler", () => {

    test("given an inexistent route it should choose default route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };
      params.req.method = "inexistent";

      await routes.handler(...params.values());

      expect(params.res.end).toHaveBeenCalledWith("Oops! Invalid Route");
    });

    test("it should set any request with CORS enabled", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };
      params.req.method = "inexistent";

      await routes.handler(...params.values());

      expect(params.res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "*"
      );
    });

    test("given method OPTIONS it should choose options route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };
      params.req.method = "OPTIONS";

      await routes.handler(...params.values());

      expect(params.res.writeHead).toHaveBeenCalledWith(204);
      expect(params.res.writeHead).toHaveBeenCalled();
    });

    test("given method GET it should choose get route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };
      params.req.method = "GET";

      jest.spyOn(routes, routes.get.name).mockResolvedValue();
      await routes.handler(...params.values());

      expect(routes.get).toHaveBeenCalled();
    });

    test("given method POST it should choose post route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };
      params.req.method = "POST";

      jest.spyOn(routes, routes.post.name).mockResolvedValue();
      await routes.handler(...params.values());

      expect(routes.post).toHaveBeenCalled();
    });
  });

  describe("#get", () => {
    test("given method GET it should list all files downloaded", async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      const fileStatusesMock = [
        {
          size: "67.3 kB",
          lastModified: '2021-09-07T14:26:36.058Z',
          owner: 'antonio',
          file: 'file.jpg',
        },
      ];

      jest.spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name).mockResolvedValue(fileStatusesMock)

      params.req.method = 'GET'
      await routes.handler(...params.values())

      expect(params.res.writeHead).toHaveBeenCalledWith(200)
      expect(params.res.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock))
    });
  });

  describe("#post", () => {
    test('it should validate post route workflow', async () => {
      const routes = new Routes('/tmp')
      const options = {
        ...defaultParams
      }

      options.req.method = 'POST'
      options.req.url = '?socketId=10'

      jest.spyOn(
        UploadHandler.prototype,
        UploadHandler.prototype.registerEvents.name
      ).mockImplementation((headers, onFinish) => {
        const writable = TestUtil.genereateWritableStream(() => {})
        writable.on("finish", onFinish)

        return writable
      })

      await routes.handler(...options.values())

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
      expect(options.res.writeHead).toHaveBeenCalledWith(200)

      const expectedResult = JSON.stringify({result: 'Files uploaded succesfully!'})
      expect(defaultParams.res.end).toHaveBeenCalledWith(expectedResult)
    })
  })
})
