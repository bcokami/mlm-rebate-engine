"use client";

/**
 * Utility for working with Web Workers
 * 
 * This module provides a simple interface for using Web Workers to perform
 * CPU-intensive tasks without blocking the main thread.
 */

// Type definitions
type WorkerTaskType = 
  | 'calculateRebates'
  | 'processGenealogyData'
  | 'calculateCommissions'
  | 'generateReportData';

interface WorkerRequest {
  id: string;
  type: WorkerTaskType;
  data: any;
}

interface WorkerResponse {
  id: string;
  type: string;
  result: any;
  error: string | null;
}

// Create a singleton worker instance
let worker: Worker | null = null;

// Map of pending tasks
const pendingTasks = new Map<string, {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}>();

/**
 * Initialize the worker
 * 
 * @returns {Worker} The worker instance
 */
function getWorker(): Worker {
  if (!worker && typeof window !== 'undefined') {
    worker = new Worker('/workers/calculation-worker.js');
    
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const { id, type, result, error } = event.data;
      
      const task = pendingTasks.get(id);
      if (task) {
        if (error) {
          task.reject(new Error(error));
        } else {
          task.resolve(result);
        }
        
        pendingTasks.delete(id);
      }
    });
    
    worker.addEventListener('error', (error) => {
      console.error('Worker error:', error);
      
      // Reject all pending tasks
      pendingTasks.forEach((task) => {
        task.reject(new Error('Worker error'));
      });
      
      pendingTasks.clear();
      
      // Recreate the worker
      worker = null;
    });
  }
  
  return worker as Worker;
}

/**
 * Generate a unique ID for a task
 * 
 * @returns {string} A unique ID
 */
function generateTaskId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Run a task in the worker
 * 
 * @param {WorkerTaskType} type - The type of task to run
 * @param {any} data - The data to pass to the task
 * @returns {Promise<any>} A promise that resolves with the result of the task
 */
export function runWorkerTask<T>(type: WorkerTaskType, data: any): Promise<T> {
  // Check if workers are supported
  if (typeof Worker === 'undefined') {
    return Promise.reject(new Error('Web Workers are not supported in this environment'));
  }
  
  try {
    const worker = getWorker();
    const id = generateTaskId();
    
    const promise = new Promise<T>((resolve, reject) => {
      pendingTasks.set(id, { resolve, reject });
    });
    
    const request: WorkerRequest = {
      id,
      type,
      data
    };
    
    worker.postMessage(request);
    
    return promise;
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Calculate rebates using the worker
 * 
 * @param {Object} data - Purchase and rebate rule data
 * @returns {Promise<any>} A promise that resolves with the calculated rebates
 */
export function calculateRebates(data: any): Promise<any> {
  return runWorkerTask('calculateRebates', data);
}

/**
 * Process genealogy data using the worker
 * 
 * @param {Object} data - Raw genealogy data
 * @returns {Promise<any>} A promise that resolves with the processed tree structure
 */
export function processGenealogyData(data: any): Promise<any> {
  return runWorkerTask('processGenealogyData', data);
}

/**
 * Calculate commissions using the worker
 * 
 * @param {Object} data - Sales and commission rule data
 * @returns {Promise<any>} A promise that resolves with the calculated commissions
 */
export function calculateCommissions(data: any): Promise<any> {
  return runWorkerTask('calculateCommissions', data);
}

/**
 * Generate report data using the worker
 * 
 * @param {Object} data - Raw data for report generation
 * @returns {Promise<any>} A promise that resolves with the processed report data
 */
export function generateReportData(data: any): Promise<any> {
  return runWorkerTask('generateReportData', data);
}

/**
 * Check if Web Workers are supported in the current environment
 * 
 * @returns {boolean} True if Web Workers are supported
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Terminate the worker
 * 
 * This should be called when the worker is no longer needed,
 * such as when the component using it is unmounted.
 */
export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingTasks.clear();
  }
}
