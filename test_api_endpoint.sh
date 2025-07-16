#!/bin/bash

# Test completo del endpoint /api/save_match con datos que causaban el problema

echo "🧪 PROBANDO ENDPOINT /api/save_match EN DOCKER"
echo "============================================="

# Datos de test
curl -X POST http://localhost:5001/api/save_match \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "team": "SAN BENEDETTO",
      "opponent": "LUNDAX LIONS AMARANTO",
      "opponent_name": "LUNDAX LIONS AMARANTO",
      "date": "2025-01-01",
      "location": "Test Stadium",
      "competition": "Test League"
    },
    "events": [
      {
        "CATEGORY": "KICK OFF",
        "PERIODS": 1,
        "timestamp_sec": 492,
        "SECOND": 492,
        "event_type": "KICK OFF",
        "extra_data": {}
      },
      {
        "CATEGORY": "END",
        "PERIODS": null,
        "timestamp_sec": 548,
        "SECOND": 548,
        "event_type": "END",
        "extra_data": {}
      }
    ],
    "profile": "event_based_default"
  }'

echo ""
echo "✅ Test completado. El END debería haber sido detectado como período 1 con Game_Time 00:56"
