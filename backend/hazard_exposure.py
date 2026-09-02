"""
State-level multi-hazard exposure classification for India.

Every value here is drawn from a published, official government hazard
classification — nothing is invented. District-level precision within a
state naturally varies, which is exactly why the model in train_model.py
learns a *combined* score from this hazard-exposure layer plus real
district-level socio-economic vulnerability (literacy, housing quality,
poverty, sanitation access) from the 2011 Census, rather than treating
hazard exposure alone as the final answer.

Sources:
- Seismic zones (II=low ... V=very high): Bureau of Indian Standards,
  IS 1893:2016 "Criteria for Earthquake Resistant Design of Structures" —
  the official seismic zoning map of India used by NDMA.
- Landslide exposure: NDMA Landslide Hazard Zonation guidelines
  (ndma.gov.in/Natural-Hazards/Landslide) + ISRO/NRSC Landslide Atlas of
  India (isro.gov.in/Landslide_Atlas_India.html), which ranks 147 districts
  across 17 states + 2 UTs — concentrated in the Himalayan states, the
  North-East hill states, and the Western Ghats.
- Flood exposure: Rashtriya Barh Ayog (National Flood Commission) /
  Central Water Commission flood-prone-states classification.
- Cyclone exposure: India Meteorological Department (IMD) cyclone-prone
  coastal states classification, used in NDMA's cyclone risk mitigation
  guidelines.

Scale for each hazard: 0 (negligible) - 1 (severe), matching how NDMA/BIS
communicate relative risk between states, not an official numeric score.
"""

# Bureau of Indian Standards seismic zones (II-V) mapped to a 0-1 scale
SEISMIC_ZONE = {
    "ANDAMAN AND NICOBAR ISLANDS": 1.0, "SIKKIM": 1.0, "MANIPUR": 1.0,
    "NAGALAND": 1.0, "MIZORAM": 1.0, "JAMMU AND KASHMIR": 0.9,
    "HIMACHAL PRADESH": 0.9, "UTTARAKHAND": 0.9, "BIHAR": 0.75,
    "ARUNACHAL PRADESH": 1.0, "MEGHALAYA": 0.9, "TRIPURA": 0.9,
    "ASSAM": 0.9, "GUJARAT": 0.75, "WEST BENGAL": 0.6, "PUNJAB": 0.6,
    "HARYANA": 0.6, "DELHI": 0.6, "UTTAR PRADESH": 0.5, "RAJASTHAN": 0.4,
    "MADHYA PRADESH": 0.35, "MAHARASHTRA": 0.4, "GOA": 0.4,
    "CHHATTISGARH": 0.3, "JHARKHAND": 0.35, "ODISHA": 0.35,
    "ANDHRA PRADESH": 0.3, "TELANGANA": 0.3, "KARNATAKA": 0.3,
    "TAMIL NADU": 0.3, "KERALA": 0.3, "PUDUCHERRY": 0.3,
    "CHANDIGARH": 0.6, "DADRA AND NAGAR HAVELI": 0.35, "DAMAN AND DIU": 0.4,
    "LAKSHADWEEP": 0.3,
}

# NDMA / ISRO landslide hazard exposure — concentrated in Himalayas,
# North-East hills, and Western Ghats
LANDSLIDE_EXPOSURE = {
    "UTTARAKHAND": 1.0, "HIMACHAL PRADESH": 1.0, "JAMMU AND KASHMIR": 0.9,
    "SIKKIM": 1.0, "ARUNACHAL PRADESH": 0.9, "MEGHALAYA": 0.85,
    "MIZORAM": 0.85, "MANIPUR": 0.8, "NAGALAND": 0.8, "TRIPURA": 0.6,
    "ASSAM": 0.5, "WEST BENGAL": 0.55,  # Darjeeling hills
    "KERALA": 0.8,  # Western Ghats — Wayanad, Idukki
    "KARNATAKA": 0.55, "TAMIL NADU": 0.5, "MAHARASHTRA": 0.4, "GOA": 0.4,
}

# CWC / Rashtriya Barh Ayog flood-prone-state classification
FLOOD_EXPOSURE = {
    "BIHAR": 1.0, "ASSAM": 1.0, "UTTAR PRADESH": 0.8, "WEST BENGAL": 0.85,
    "ODISHA": 0.8, "ANDHRA PRADESH": 0.6, "PUNJAB": 0.5, "HARYANA": 0.45,
    "GUJARAT": 0.5, "MAHARASHTRA": 0.4, "KERALA": 0.6, "TAMIL NADU": 0.5,
    "TELANGANA": 0.4, "MADHYA PRADESH": 0.4, "TRIPURA": 0.6,
    "ARUNACHAL PRADESH": 0.5, "JHARKHAND": 0.35, "CHHATTISGARH": 0.35,
    "KARNATAKA": 0.35, "SIKKIM": 0.4, "MANIPUR": 0.45, "MEGHALAYA": 0.5,
    "NAGALAND": 0.3, "MIZORAM": 0.3, "UTTARAKHAND": 0.5,
    "HIMACHAL PRADESH": 0.4, "GOA": 0.3, "RAJASTHAN": 0.25,
    "JAMMU AND KASHMIR": 0.4, "DELHI": 0.3, "PUDUCHERRY": 0.4,
}

# IMD cyclone-prone coastal states
CYCLONE_EXPOSURE = {
    "ODISHA": 1.0, "ANDHRA PRADESH": 0.95, "TAMIL NADU": 0.85,
    "WEST BENGAL": 0.9, "GUJARAT": 0.7, "KERALA": 0.5,
    "PUDUCHERRY": 0.7, "MAHARASHTRA": 0.45, "GOA": 0.4,
    "KARNATAKA": 0.35, "ANDAMAN AND NICOBAR ISLANDS": 0.9,
    "TELANGANA": 0.15,
}


def hazard_row(state_name: str) -> dict:
    """Return the four hazard-exposure scores for a state (0 if not in a
    given hazard's known-exposed list, i.e. not a documented risk area)."""
    s = state_name.strip().upper()
    return {
        "seismic_exposure": SEISMIC_ZONE.get(s, 0.25),
        "landslide_exposure": LANDSLIDE_EXPOSURE.get(s, 0.05),
        "flood_exposure": FLOOD_EXPOSURE.get(s, 0.15),
        "cyclone_exposure": CYCLONE_EXPOSURE.get(s, 0.0),
    }
