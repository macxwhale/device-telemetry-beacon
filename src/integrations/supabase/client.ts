
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = "https://byvbunvegjwzgytavgkv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dmJ1bnZlZ2p3emd5dGF2Z2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzM3MzMsImV4cCI6MjA2MjM0OTczM30.JaYx-kQuM2_L2li9I3a0fy9bUIwFP1e40iIRM7gVBFA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
