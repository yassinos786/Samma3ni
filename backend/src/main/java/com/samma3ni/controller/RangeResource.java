package com.samma3ni.controller;

import org.springframework.core.io.Resource;
import java.io.*;

/**
 * Resource wrapper that supports HTTP Range requests for audio seeking.
 */
public class RangeResource implements Resource {

    private final Resource delegate;
    private final long start;
    private final long length;

    public RangeResource(Resource delegate, long start, long length) {
        this.delegate = delegate;
        this.start = start;
        this.length = length;
    }

    @Override
    public InputStream getInputStream() throws IOException {
        InputStream is = delegate.getInputStream();
        is.skip(start);
        return new BoundedInputStream(is, length);
    }

    @Override public boolean exists() { return delegate.exists(); }
    @Override public java.net.URL getURL() throws IOException { return delegate.getURL(); }
    @Override public java.net.URI getURI() throws IOException { return delegate.getURI(); }
    @Override public java.io.File getFile() throws IOException { return delegate.getFile(); }
    @Override public long contentLength() { return length; }
    @Override public long lastModified() throws IOException { return delegate.lastModified(); }
    @Override public Resource createRelative(String relativePath) throws IOException { return delegate.createRelative(relativePath); }
    @Override public String getFilename() { return delegate.getFilename(); }
    @Override public String getDescription() { return delegate.getDescription(); }

    private static class BoundedInputStream extends InputStream {
        private final InputStream wrapped;
        private long remaining;
        BoundedInputStream(InputStream wrapped, long limit) { this.wrapped = wrapped; this.remaining = limit; }
        @Override public int read() throws IOException {
            if (remaining <= 0) return -1;
            int b = wrapped.read();
            if (b != -1) remaining--;
            return b;
        }
        @Override public int read(byte[] b, int off, int len) throws IOException {
            if (remaining <= 0) return -1;
            int toRead = (int) Math.min(len, remaining);
            int read = wrapped.read(b, off, toRead);
            if (read > 0) remaining -= read;
            return read;
        }
        @Override public void close() throws IOException { wrapped.close(); }
    }
}
