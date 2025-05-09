"use client";

/**
 * Service Worker Registration Utility
 * 
 * This module provides functions to register, update, and manage the service worker.
 */

// Check if service workers are supported
const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Register the service worker
export const registerServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    console.log('Service workers are not supported in this browser');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    
    console.log('Service worker registered successfully:', registration.scope);
    
    // Set up update checking
    setupUpdateChecking(registration);
    
    return true;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return false;
  }
};

// Check for service worker updates
const setupUpdateChecking = (registration: ServiceWorkerRegistration) => {
  // Check for updates every hour
  setInterval(() => {
    registration.update();
  }, 60 * 60 * 1000);
  
  // Listen for new service worker installation
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    if (!newWorker) return;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is installed but waiting to activate
        showUpdateNotification();
      }
    });
  });
};

// Show a notification when a new service worker is available
const showUpdateNotification = () => {
  // This could be implemented with a UI component
  console.log('New version available! Refresh to update.');
  
  // Example: Dispatch an event that a React component could listen for
  const event = new CustomEvent('serviceWorkerUpdateAvailable');
  window.dispatchEvent(event);
};

// Unregister all service workers
export const unregisterServiceWorkers = async () => {
  if (!isServiceWorkerSupported()) {
    return false;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    console.log('Service workers unregistered successfully');
    return true;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
};

// Check if the app is installed (PWA)
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         (window.navigator as any).standalone === true;
};

// Request permission for push notifications
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async () => {
  if (!isServiceWorkerSupported()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push manager is supported
    if (!registration.pushManager) {
      console.log('Push notifications are not supported');
      return null;
    }
    
    // Get permission
    const permission = await requestNotificationPermission();
    
    if (!permission) {
      console.log('Notification permission denied');
      return null;
    }
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // This should be your VAPID public key
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      )
    });
    
    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
