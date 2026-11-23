import { ForbiddenError, UnauthorizedError } from '../common/errors.js';

export function createAuthGuard(verifyToken) {
  return async function requireAuth(request) {
    const header = request.headers?.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }
    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedError('Empty bearer token');
    }
    if (typeof verifyToken !== 'function') {
      throw new UnauthorizedError('Authentication verifier not configured');
    }
    const user = await verifyToken(token, request);
    if (!user || !user.id) {
      throw new UnauthorizedError('Invalid authentication session');
    }
    request.user = user;
  };
}

export const requireAuth = createAuthGuard(null);

export function requireRoles(...allowedRoles) {
  return async function checkRoles(request) {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError('Role does not have access to this resource');
    }
  };
}
