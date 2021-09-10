import Routes from '../../src/routes.js';
import { logger } from '../../src/logger.js';
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from '../utils/testUtil.js';
import {
  describe,
  test,
  expect,
  beforeEach,
  jest
} from "@jest/globals";
import { pipeline } from 'stream/promises';
import fs from 'fs'
import { resolve } from 'path'

describe('#UploadHandler test suite', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, 'info')
        .mockImplementation()
  })

  describe('#registerEvents', () => {
    test('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })

      jest.spyOn(uploadHandler, uploadHandler.onFile.name)
          .mockResolvedValue()

      const headers = {
        'content-type': 'multipart/form-data; boundary='
      }

      const onFinish = jest.fn() 
      
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

      const fileStream = TestUtil.generateReadableStream([ 'chunk', 'of', 'data' ])
      
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')
      busboyInstance.listeners("finish")[0].call()

      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(onFinish).toHaveBeenCalled()

    })
  })

  describe('#onFile', () => {
    test('given a stream file it should save it on disk', async () => {
      const chunks = ['hello,', 'world!'],
            downloadsFolder = '/tmp',
            handler = new UploadHandler({
              io: ioObj,
              socketId: '01',
              downloadsFolder
            })
            
      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name)
          .mockImplementation(() => TestUtil.genereateWritableStream(onData))

      const onTransform = jest.fn()
      jest.spyOn(handler, handler.handleFileBytes.name)
          .mockImplementation(() => TestUtil.generateTransformStream(onTransform))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mp4'
      }

      await handler.onFile(...Object.values(params))

      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())

      const expectedFilename = resolve(handler.downloadsFolder, params.filename)
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
    })
  })

  describe('#handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })

      jest.spyOn(handler, handler.canExecute.name)
          .mockReturnValue(true)

      const messages = ['hello'],
            source = TestUtil.generateReadableStream(messages),
            onWrite = jest.fn(),
            target = TestUtil.genereateWritableStream(onWrite)

      await pipeline(
        source,
        handler.handleFileBytes("filename.txt"),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)

      expect(onWrite).toBeCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })

    test('given message timerDelay as 2secs it should emit only two messages during 2 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name) 
      
      const dateTime = '2021-07-01 01:01',
            firstMessageSent = TestUtil.getTimeFromDate(`${dateTime}:00`),
            firstExecution = TestUtil.getTimeFromDate(`${dateTime}:02`),
            updateMessageSent = firstExecution,
            secondExecution = TestUtil.getTimeFromDate(`${dateTime}:03`),
            thirdExecution = TestUtil.getTimeFromDate(`${dateTime}:04`)

      TestUtil.mockDateNow(
        [
          firstMessageSent,
          firstExecution,
          updateMessageSent,
          secondExecution,
          thirdExecution
        ]
      )

      const messageTimeDelay = 2000,
            handler = new UploadHandler({
              messageTimeDelay,
              io: ioObj,
              socketId: '01'
            }),
            messages = ['hello', 'hello', 'world'],
            source = TestUtil.generateReadableStream(messages),
            expectedMessageSent = 2,
            filename = 'filename.avi'

            
      await pipeline (
        source,
        handler.handleFileBytes(filename)
      )
              
      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent)
      
      const [ firstCallResult, secondCallResult ] = ioObj.emit.mock.calls
      
      expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: 'hello'.length, filename}])
      expect(secondCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: messages.join("").length, filename }])      
    })
  })

  describe('#canExecute', () => {
    test('should return true when time is later than specified delay', () => {
      
      const timerDelay = 1000,
            uploadHandler = new UploadHandler({
              io: {},
              socketId: '',
              messageTimeDelay: timerDelay
            })
            
      const now = TestUtil.getTimeFromDate('2021-07-01 00:00:02')
      TestUtil.mockDateNow([now])
            
      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')
            
      const result = uploadHandler.canExecute(lastExecution)
      

      expect(result).toBeTruthy()
    })
    test('should return false when time isnt later than specified delay', () => {
      const timerDelay = 3000,
            uploadHandler = new UploadHandler({
              io: {},
              socketId: '',
              messageTimeDelay: timerDelay
            })
            
      const now = TestUtil.getTimeFromDate('2021-07-01 00:00:02')
      TestUtil.mockDateNow([now])
      
      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:01')
            
      const result = uploadHandler.canExecute(lastExecution)
      

      expect(result).toBeFalsy()
    })
  })
})