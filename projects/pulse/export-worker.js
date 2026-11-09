// Builds the PDF away from the browser UI thread. It receives only the selected
// in-memory report data and returns PDF bytes; it does not call the API.
self.window = self;
var cases = [];
var reportData = {};
var reportRich = {};
var snapshotDate = '';
importScripts('vendor/jspdf.umd.min.js', 'export-core.js');

self.onmessage = event => {
  const { spec, rows, allCases, reports, rich, capturedAt } = event.data;
  cases = allCases;
  reportData = reports;
  reportRich = rich;
  snapshotDate = capturedAt;
  try {
    const bytes = buildExportPdf(spec, rows).output('arraybuffer');
    self.postMessage({ ok: true, bytes }, [bytes]);
  } catch (error) {
    self.postMessage({ ok: false, error: error.message || 'Could not build this PDF.' });
  }
};
