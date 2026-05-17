from http.server import HTTPServer, SimpleHTTPRequestHandler

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

print('Serving on http://10.0.0.156:8080')
HTTPServer(('', 8080), NoCacheHandler).serve_forever()
