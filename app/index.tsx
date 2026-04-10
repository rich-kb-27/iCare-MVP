import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // This is the "Auto-Bounce". 
  // It doesn't wait 3 seconds; it happens instantly.
  return <Redirect href="/splash" />;
}