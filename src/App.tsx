/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './AppLayout';

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </ToastProvider>
  );
}
