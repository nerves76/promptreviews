# Patent Diagrams for PromptReviews AI-Assisted Review System

This directory contains the technical diagrams for the PromptReviews provisional patent application.

## Files

### Figure 1: System Architecture Overview
- **Source**: `figure1-system-architecture.mermaid`
- **PNG**: `figure1-system-architecture.png`
- **Description**: Illustrates the core system components including Core Processing Server (100), Database Layer (200), AI Processing Module (300), Interface Generation Engine (400), Multi-Modal Capture System (500), Submission Distribution Engine (600), Embeddable Widget Framework (700), Physical-Digital Integration Engine (800), Brand Signifier Management System (900), and Template Generation Engine (1000), showing their interconnections and the novel physical-digital integration technologies.

### Figure 2: Physical-Digital Integration Process Flow
- **Source**: `figure2-physical-digital-integration.mermaid`
- **PNG**: `figure2-physical-digital-integration.png`
- **Description**: Depicts the complete customer interaction flow from physical deployment method initiation (QR code scan, NFC touch, direct link, or physical template interaction) through brand signifier recognition, dynamic interface generation, AI-assisted content creation with human authentication, multi-modal capture, sentiment analysis, and multi-platform distribution with physical deployment attribution tracking.

### Figure 3: Multi-Deployment Configuration Architecture
- **Source**: `figure3-multi-deployment-configuration.mermaid`
- **PNG**: `figure3-multi-deployment-configuration.png`
- **Description**: Shows the Multi-Deployment Configuration Engine and its five distinct operational modes: 1-on-1 Personal Interactions, Location-Based Universal Access, Service-Specific Configuration, Product-Specific Configuration, and Time-Sensitive Configuration, along with their integration with physical media types (business cards, lanyards, frames, signage, stickers, table tents) and brand signifier deployment strategies.

### Figure 4: Human Authentication Layer and Multi-Modal Correlation Sequence
- **Source**: `figure4-human-authentication-sequence.mermaid`
- **PNG**: `figure4-human-authentication-sequence.png`
- **Description**: Illustrates the sequential process flow showing the novel human authentication layer that prevents AI-generated content from being submitted without explicit human approval and modification, the multi-modal capture correlation system that preserves contextual metadata across text, photo, and video content, and the sentiment-based routing with physical deployment context consideration.

## Technical Specifications

- **Format**: PNG images generated from Mermaid diagrams
- **Resolution**: 2000x1400 pixels (high resolution for patent submission)
- **Tool**: Mermaid CLI (@mermaid-js/mermaid-cli)
- **Created**: July 2025

## Usage

These diagrams are designed for inclusion in the provisional patent application and demonstrate the technical innovations that distinguish the PromptReviews invention from prior art systems, particularly:

1. Novel integration of physical deployment methods with digital review generation processes
2. Comprehensive brand signifier recognition system
3. Multi-modal capture correlation with preserved contextual metadata
4. Human authentication layer preventing unauthorized AI content submission
5. Physical-digital bridge technology with QR/NFC integration

## Patent Reference

These diagrams support the patent claims outlined in `PromptReviews_Provisional_Patent_Draft.txt` and provide visual representation of the technical architecture described in the detailed specification.

## Regenerating Diagrams

To regenerate the PNG files from the Mermaid source files:

```bash
# Install Mermaid CLI (if not already installed)
npm install -g @mermaid-js/mermaid-cli

# Convert each diagram
mmdc -i figure1-system-architecture.mermaid -o figure1-system-architecture.png -w 2000 -H 1400
mmdc -i figure2-physical-digital-integration.mermaid -o figure2-physical-digital-integration.png -w 2000 -H 1400
mmdc -i figure3-multi-deployment-configuration.mermaid -o figure3-multi-deployment-configuration.png -w 2000 -H 1400
mmdc -i figure4-human-authentication-sequence.mermaid -o figure4-human-authentication-sequence.png -w 2000 -H 1400
``` 