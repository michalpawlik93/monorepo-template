import {
  combineResults,
  empty,
  basicErr,
  ok,
  errorsToString,
  isOk,
  isErr,
  isNotFound,
  NotFoundMessage,
  Result,
  notFoundErr,
} from '../result';

describe('Result utilities tests', () => {
  describe('combineResults tests', () => {
    test('should return success if all tasks are successful', async () => {
      // Arrange
      const task1 = jest.fn().mockResolvedValue(empty(['Task 1 succeeded']));
      const task2 = jest.fn().mockResolvedValue(empty(['Task 2 succeeded']));

      // Act
      const result = await combineResults(task1, task2);

      // Assert
      expect(result).toEqual(empty(['Task 1 succeeded', 'Task 2 succeeded']));
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);
    });

    test('should return failure if one of the tasks fails', async () => {
      // Arrange
      const task1 = jest.fn().mockResolvedValue(empty(['Task 1 succeeded']));
      const task2 = jest.fn().mockResolvedValue(basicErr('Error in task 2'));

      // Act
      const result = await combineResults(task1, task2);

      // Assert
      expect(result).toEqual(basicErr('Error in task 2'));
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);
    });

    test('should return failure if first task fails', async () => {
      // Arrange
      const task1 = jest.fn().mockResolvedValue(basicErr('Error in task 1'));
      const task2 = jest.fn().mockResolvedValue(empty(['Task 2 succeeded']));

      // Act
      const result = await combineResults(task1, task2);

      // Assert
      expect(result).toEqual(basicErr('Error in task 1'));
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(0);
    });

    test('should handle a single successful task correctly', async () => {
      // Arrange
      const task1 = jest
        .fn()
        .mockResolvedValue(empty(['Single task succeeded']));

      // Act
      const result = await combineResults(task1);

      // Assert
      expect(result).toEqual(empty(['Single task succeeded']));
      expect(task1).toHaveBeenCalledTimes(1);
    });

    test('should handle a single failed task correctly', async () => {
      // Arrange
      const task1 = jest
        .fn()
        .mockResolvedValue(basicErr('Error in single task'));

      // Act
      const result = await combineResults(task1);

      // Assert
      expect(result).toEqual(basicErr('Error in single task'));
      expect(task1).toHaveBeenCalledTimes(1);
    });

    test('should handle no tasks provided', async () => {
      // Act
      const result = await combineResults();

      // Assert
      expect(result).toEqual(empty());
    });
  });

  describe('errorsToString tests', () => {
    test('should convert error to string correctly', () => {
      // Arrange
      const error = basicErr('Test error message');

      // Act
      const errorMessage = errorsToString(error);

      // Assert
      expect(errorMessage).toEqual('[SystemError] Test error message');
    });

    test('should preserve cause when provided', () => {
      // Arrange
      const originalError = new Error('original');
      const error = basicErr('Test error message', originalError);

      // Assert
      expect(error.error.cause).toBe(originalError);
    });

    test('should keep cause undefined for backward compatibility', () => {
      // Arrange
      const error = basicErr('Test error message');

      // Assert
      expect(error.error.cause).toBeUndefined();
    });
  });

  describe('Result type guards', () => {
    test('isOk should identify Ok correctly', () => {
      // Arrange
      const successResult = ok('Success value');

      // Act & Assert
      expect(isOk(successResult)).toBe(true);
      expect(isErr(successResult)).toBe(false);
    });

    test('isErr should identify Err correctly', () => {
      // Arrange
      const errorResult = basicErr('Error value');

      // Act & Assert
      expect(isErr(errorResult)).toBe(true);
      expect(isOk(errorResult)).toBe(false);
    });
  });

  describe('isNotFound', () => {
    it('should return true for an Err with NotFoundError type', () => {
      //Arrange & Act
      const notFoundError = notFoundErr('Resource not found');

      //Assert
      expect(isNotFound(notFoundError)).toBe(true);
    });

    it('should return false for a successful result (Ok)', () => {
      //Arrange & Act
      const successResult: Result<unknown, NotFoundMessage> = ok('Success');

      //Assert
      expect(isNotFound(successResult)).toBe(false);
    });
  });
});
