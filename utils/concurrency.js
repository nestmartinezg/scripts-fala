import pLimit from "p-limit";

/**
 * Runs async tasks with controlled concurrency.
 *
 * @param {Array<any>} items - Items to process
 * @param {number} concurrency - Max number of tasks running at once
 * @param {Function} taskFn - Function that receives (item) and returns a Promise
 * @returns {Promise<Array<any>>}
 */
export async function runConcurrent(items, concurrency = 5, taskFn) {
  const limit = pLimit(concurrency);

  const tasks = items.map((item) => limit(() => taskFn(item)));

  return Promise.all(tasks);
}
