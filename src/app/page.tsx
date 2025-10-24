'use client'

import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { 
  Scale, 
  Shield, 
  FileText, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Globe,
  Mail,
  ArrowUp,
  ShieldUser
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Section - Full Height */}
      <div className="h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex justify-center items-center gap-4 mb-8"
            >
              <ShieldUser className="h-12 w-12 text-primary" />
              <Scale className="h-16 w-16 text-primary" />
              <FileText className="h-12 w-12 text-primary" />
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Legal Compliance <span className="text-primary">Chatbot for Startups</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              AI-powered legal compliance assistance for startups. Get instant answers to your legal questions
              and ensure your business stays compliant with regulations, contracts, and legal requirements.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Link href="/auth/login">
                <Button size="lg" className="text-lg px-8 py-4 cursor-pointer">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Content that appears on scroll */}
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Features Grid - 2 cards per row */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, staggerChildren: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Scale className="h-6 w-6 text-primary" />
                  <CardTitle>Smart Legal Guidance</CardTitle>
                </div>
                <CardDescription>
                  Get instant answers to complex legal questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI chatbot provides comprehensive legal guidance tailored specifically for startups. 
                  Ask about incorporation, business structures, compliance requirements, and get detailed 
                  explanations backed by current legal standards.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle>Compliance Monitoring</CardTitle>
                </div>
                <CardDescription>
                  Stay up-to-date with regulatory changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor regulatory changes and receive alerts about compliance requirements relevant to your business. 
                  Track employment laws, data protection requirements, tax obligations, and industry-specific regulations.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <CardTitle>Document Analysis</CardTitle>
                </div>
                <CardDescription>
                  Analyze legal documents for compliance issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload and analyze contracts, policies, terms of service, and other legal documents to identify 
                  potential compliance issues, missing clauses, and areas that need legal attention.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <CardTitle>24/7 Availability</CardTitle>
                </div>
                <CardDescription>
                  Legal guidance whenever you need it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access legal compliance guidance anytime, day or night. No need to wait for business hours 
                  or schedule expensive lawyer consultations for basic compliance questions.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Why It's Useful Section - Fixed dark mode styling */}
        <motion.section 
          className="py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Legal Compliance Matters for Startups</h2>
            <p className="text-xl text-muted-foreground">
              Startups face unique legal challenges that can make or break their business. Our chatbot helps you navigate these complexities effectively.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div>
              <Card className="h-full border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <CardTitle className="text-destructive">Common Startup Legal Pitfalls</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span className="text-sm">Improper business structure selection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span className="text-sm">Missing employment law compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span className="text-sm">Inadequate intellectual property protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span className="text-sm">Non-compliance with data protection laws</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span className="text-sm">Poorly drafted contracts and agreements</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <CardTitle className="text-primary">How Our Chatbot Helps</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm">Instant guidance on legal structure choices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm">Employment law compliance checklists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm">IP protection strategy recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm">GDPR and data privacy compliance guides</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm">Contract templates and review assistance</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>

        {/* Statistics Section */}
        <motion.section 
          className="py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-6"
            >
              <div className="flex justify-center mb-4">
                <TrendingUp className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-2">70%</h3>
              <p className="text-muted-foreground">of startups fail due to legal and compliance issues</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6"
            >
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-2">$15K+</h3>
              <p className="text-muted-foreground">Average cost of legal consultation for startups</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6"
            >
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-2">24/7</h3>
              <p className="text-muted-foreground">Instant legal guidance without waiting</p>
            </motion.div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section 
          className="py-20 text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="p-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl mb-4">Ready to Ensure Legal Compliance?</CardTitle>
              <CardDescription className="text-lg mb-6">
                Join thousands of startups using our AI-powered legal compliance chatbot to stay protected and compliant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login">
<Button 
  size="lg" 
  className="
    text-sm sm:text-base md:text-lg 
    px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4
    min-h-[48px] sm:min-h-[52px]
    w-full sm:w-auto
    max-w-[280px] sm:max-w-none
    whitespace-normal
    leading-tight
    text-center
    cursor-pointer
  "
>
  Start Your Free Legal Consultation
</Button>


              </Link>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Footer */}
      <motion.footer 
        className="bg-muted"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldUser className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold">LCCFS</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Legal Compliance Chatbot for Startups - Your AI-powered legal assistant for business compliance and growth.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>Legal Compliance Guidance</li>
                <li>Document Analysis</li>
                <li>Regulatory Monitoring</li>
                <li>Contract Review</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-semibold mb-4">Use Cases</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>Startup Incorporation</li>
                <li>Business Structure Planning</li>
                <li>IP Protection Strategy</li>
                <li>Data Privacy Compliance</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@lccfs.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Available worldwide</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="border-t border-muted-foreground/20 mt-12 pt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-muted-foreground text-sm">
              © 2025 Legal Compliance Chatbot for Startups. All rights reserved.
            </p>
          </motion.div>
        </div>
      </motion.footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </>
  )
}
