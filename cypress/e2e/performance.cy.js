import { safeVisit } from '../support/test-utils';

describe('Performance Tests', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Registration' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/products', name: 'Products' },
    { path: '/genealogy', name: 'Genealogy' },
    { path: '/rebates', name: 'Rebates' }
  ];
  
  pages.forEach(page => {
    it(`should measure performance for ${page.name} page`, () => {
      // Clear browser cache before each test
      cy.clearCookies();
      cy.clearLocalStorage();
      
      // Visit the page and measure performance
      safeVisit(page.path);
      
      // Check performance metrics
      cy.window().then(win => {
        if (win.performance) {
          // Get navigation timing
          const perfData = win.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domLoadTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
          const networkLatency = perfData.responseEnd - perfData.requestStart;
          const processingTime = perfData.loadEventEnd - perfData.responseEnd;
          
          // Log performance metrics
          cy.log(`Page: ${page.name}`);
          cy.log(`Total Page Load Time: ${pageLoadTime}ms`);
          cy.log(`DOM Load Time: ${domLoadTime}ms`);
          cy.log(`Network Latency: ${networkLatency}ms`);
          cy.log(`Processing Time: ${processingTime}ms`);
          
          // Log performance entry if available
          if (win.performance.getEntriesByType) {
            const navEntry = win.performance.getEntriesByType('navigation')[0];
            if (navEntry) {
              cy.log(`DNS Time: ${navEntry.domainLookupEnd - navEntry.domainLookupStart}ms`);
              cy.log(`Connection Time: ${navEntry.connectEnd - navEntry.connectStart}ms`);
              cy.log(`Request Time: ${navEntry.responseStart - navEntry.requestStart}ms`);
              cy.log(`Response Time: ${navEntry.responseEnd - navEntry.responseStart}ms`);
              cy.log(`DOM Processing Time: ${navEntry.domComplete - navEntry.responseEnd}ms`);
            }
            
            // Get resource timing
            const resources = win.performance.getEntriesByType('resource');
            const jsResources = resources.filter(r => r.name.endsWith('.js'));
            const cssResources = resources.filter(r => r.name.endsWith('.css'));
            const imgResources = resources.filter(r => r.name.endsWith('.png') || r.name.endsWith('.jpg') || r.name.endsWith('.jpeg') || r.name.endsWith('.gif') || r.name.endsWith('.svg'));
            
            cy.log(`JS Resources: ${jsResources.length}`);
            cy.log(`CSS Resources: ${cssResources.length}`);
            cy.log(`Image Resources: ${imgResources.length}`);
            
            // Calculate total resource size if available
            let totalSize = 0;
            resources.forEach(r => {
              if (r.transferSize) {
                totalSize += r.transferSize;
              }
            });
            
            cy.log(`Total Transfer Size: ${(totalSize / 1024).toFixed(2)} KB`);
          }
        } else {
          cy.log('Performance API not available');
        }
      });
    });
  });
  
  it('should measure time to interactive', () => {
    // Clear browser cache
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Visit the home page
    safeVisit('/');
    
    // Measure time to first interaction
    const startTime = Date.now();
    
    // Try to find and interact with elements
    cy.get('button, a').then($elements => {
      if ($elements.length > 0) {
        // Calculate time to find interactive elements
        const timeToFind = Date.now() - startTime;
        cy.log(`Time to find interactive elements: ${timeToFind}ms`);
        
        // Try to click the first element
        cy.wrap($elements.eq(0)).click({ force: true });
        
        // Calculate time to first interaction
        const timeToInteract = Date.now() - startTime;
        cy.log(`Time to first interaction: ${timeToInteract}ms`);
      } else {
        cy.log('No interactive elements found');
      }
    });
  });
  
  it('should measure rendering performance', () => {
    // Clear browser cache
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Visit the home page
    safeVisit('/');
    
    // Check for long tasks
    cy.window().then(win => {
      if (win.PerformanceObserver && win.PerformanceObserver.supportedEntryTypes && win.PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        cy.log('Long tasks API is supported');
        
        // We can't actually use PerformanceObserver in Cypress, but we can log that it's supported
        cy.log('Long tasks would be measured in a real performance monitoring setup');
      } else {
        cy.log('Long tasks API is not supported');
      }
    });
    
    // Check for layout shifts
    cy.window().then(win => {
      if (win.PerformanceObserver && win.PerformanceObserver.supportedEntryTypes && win.PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
        cy.log('Layout Shift API is supported');
        
        // We can't actually use PerformanceObserver in Cypress, but we can log that it's supported
        cy.log('Layout shifts would be measured in a real performance monitoring setup');
      } else {
        cy.log('Layout Shift API is not supported');
      }
    });
  });
});
