locals {
  location_slug = lookup(zipmap(values(local.regions), keys(local.regions)), var.azure_region, lookup(zipmap(values(local.cli_names), keys(local.cli_names)), var.azure_region, var.azure_region))

  # Azure region mapping between slug and standard format.
  # Markdown doc generated by: > join("\n", [for slug, region in local.regions: format("| %s | %s | %s | %s | %s | %s |", region, local.cli_names[slug], local.short_names[slug], slug, try(local.paired[slug], "N/A"), try(local.data[slug], "N/A"))])
  regions = {
    asia-east        = "East Asia"
    asia-south-east  = "Southeast Asia"
    aus-central-2    = "Australia Central 2"
    aus-central      = "Australia Central"
    aus-east         = "Australia East"
    aus-south-east   = "Australia Southeast"
    bra-south        = "Brazil South"
    bra-south-east   = "Brazil Southeast"
    can-central      = "Canada Central"
    can-east         = "Canada East"
    cn-east-2        = "China East 2"
    cn-east-3        = "China East 3"
    cn-east          = "China East"
    cn-north-2       = "China North 2"
    cn-north-3       = "China North 3"
    cn-north         = "China North"
    eu-north         = "North Europe"
    eu-west          = "West Europe"
    fr-central       = "France Central"
    fr-south         = "France South"
    ger-central      = "Germany Central"
    ger-north-east   = "Germany Northeast"
    ger-north        = "Germany North"
    ger-west-central = "Germany West Central"
    ind-central      = "Central India"
    ind-south        = "South India"
    ind-west         = "West India"
    isr-central      = "Israel Central"
    ita-north        = "Italy North"
    jap-east         = "Japan East"
    jap-west         = "Japan West"
    kor-central      = "Korea Central"
    kor-south        = "Korea South"
    norw-east        = "Norway East"
    norw-west        = "Norway West"
    nz-north         = "New Zealand North"
    pol-central      = "Poland Central"
    qat-central      = "Qatar Central"
    saf-north        = "South Africa North"
    saf-west         = "South Africa West"
    swe-central      = "Sweden Central"
    swe-south        = "Sweden South"
    swz-north        = "Switzerland North"
    swz-west         = "Switzerland West"
    uae-central      = "UAE Central" # United Arab Emirates
    uae-north        = "UAE North"   # United Arab Emirates
    uk-south         = "UK South"
    uk-west          = "UK West"
    us-central       = "Central US"
    us-east-2        = "East US 2"
    us-east          = "East US"
    us-north-central = "North Central US"
    us-south-central = "South Central US"
    us-west-2        = "West US 2"
    us-west-3        = "West US 3"
    us-west-central  = "West Central US"
    us-west          = "West US"
  }

  /* Short names based on the following rules (where possible) to have better clarity:
      - contains at least 3 chars, where 2 chars represent global part (continent)
      - use ISO 3166 code of country concatenation
    */
  short_names = {
    "asia-east"        = "asea"
    "asia-south-east"  = "asse"
    "aus-central-2"    = "auc2"
    "aus-central"      = "auc"
    "aus-east"         = "aue"
    "aus-south-east"   = "ause"
    "bra-south"        = "brs"
    "bra-south-east"   = "brse" # Brazil Southeast
    "can-central"      = "cac"
    "can-east"         = "cae"
    "cn-east-2"        = "cne2"
    "cn-east-3"        = "cne3"
    "cn-east"          = "cne"
    "cn-north-2"       = "cnn2"
    "cn-north-3"       = "cnn3"
    "cn-north"         = "cnn"
    "eu-north"         = "eun"
    "eu-west"          = "euw"
    "fr-central"       = "frc"
    "fr-south"         = "frs"
    "ger-central"      = "gce"
    "ger-north-east"   = "gne"
    "ger-north"        = "gno"
    "ger-west-central" = "gwc"
    "ind-central"      = "inc"
    "ind-south"        = "ins"
    "ind-west"         = "inw"
    "isr-central"      = "ilc"
    "ita-north"        = "itn"
    "jap-east"         = "jpe"
    "jap-west"         = "jpw"
    "kor-central"      = "krc"
    "kor-south"        = "krs"
    "norw-east"        = "noe"
    "norw-west"        = "now"
    "nz"               = "nz"
    "nz-north"         = "nzn"
    "pol-central"      = "polc"
    "qat-central"      = "qatc"
    "saf-north"        = "san"
    "saf-west"         = "saw"
    "swe-central"      = "swec"
    "swe-south"        = "swes"
    "swz-north"        = "swn"
    "swz-west"         = "sww"
    "uae-central"      = "uaec"
    "uae-north"        = "uaen"
    "uk-south"         = "uks"
    "uk-west"          = "ukw"
    "us-central"       = "usc"
    "us-east-2"        = "use2"
    "us-east"          = "use"
    "us-north-central" = "usnc"
    "us-south-central" = "ussc"
    "us-west-2"        = "usw2"
    "us-west-3"        = "usw3"
    "us-west-central"  = "uswc"
    "us-west"          = "usw"


    # Global/continental zones
    "asia"    = "asia" # Asia
    "asia-pa" = "apac" # Asia Pacific
    "aus"     = "aus"  # Australia
    "bra"     = "bra"  # Brazil
    "can"     = "can"  # Canada
    "eu"      = "eu"   # Europe
    "global"  = "glob" # Global
    "ind"     = "ind"  # India
    "jap"     = "jap"  # Japan
    "kor"     = "kor"  # Korea
    "nor"     = "nor"  # Norway
    "sgp"     = "sgp"  # Singapore
    "swe"     = "swe"  # Sweden
    "uk"      = "uk"   # United Kingdom
    "us"      = "us"   # United States
  }

  # Thoses region CLI name where partially generated via
  # `az account list-locations --output json | jq -r '.[] | "\"\" = \"" + .name + "\" # " + .displayName'`
  # Markdown doc generated by: > join("\n", [for slug, region in local.regions: format("| %s | %s | %s |", slug, local.cli_names[slug], region)])
  cli_names = {
    "asia"             = "asia"               # Asia
    "asia-east"        = "eastasia"           # East Asia
    "asia-pa"          = "asiapacific"        # Asia Pacific
    "asia-south-east"  = "southeastasia"      # Southeast Asia
    "aus"              = "australia"          # Australia
    "aus-central-2"    = "australiacentral2"  # Australia Central 2
    "aus-central"      = "australiacentral"   # Australia Central
    "aus-east"         = "australiaeast"      # Australia East
    "aus-south-east"   = "australiasoutheast" # Australia Southeast
    "bra"              = "brazil"             # Brazil
    "bra-south"        = "brazilsouth"        # Brazil South
    "bra-south-east"   = "brazilsoutheast"    # Brazil Southeast
    "can"              = "canada"             # Canada
    "can-central"      = "canadacentral"      # Canada Central
    "can-east"         = "canadaeast"         # Canada East
    "cn-east-2"        = "chinaeast2"         # "China East 2"
    "cn-east-3"        = "chinaeast3"         # "China East 3"
    "cn-east"          = "chinaeast"          # "China East"
    "cn-north-2"       = "chinanorth2"        # "China North 2"
    "cn-north-3"       = "chinanorth3"        # "China North 3"
    "cn-north"         = "chinanorth"         # "China North"
    "eu"               = "europe"             # Europe
    "eu-north"         = "northeurope"        # North Europe
    "eu-west"          = "westeurope"         # West Europe
    "fr-central"       = "francecentral"      # France Central
    "fr-south"         = "francesouth"        # France South
    "ger-central"      = "germanycentral"     # Germany Central
    "ger-north-east"   = "germanynortheast"   # Germany Northeast
    "ger-north"        = "germanynorth"       # Germany North
    "ger-west-central" = "germanywestcentral" # Germany West Central
    "global"           = "global"             # Global
    "ind-central"      = "centralindia"       # Central India
    "ind"              = "india"              # India
    "ind-south"        = "southindia"         # South India
    "ind-west"         = "westindia"          # West India
    "isr-central"      = "israelcentral"      # Israel Central
    "ita-north"        = "italynorth"         # Italy North
    "jap-east"         = "japaneast"          # Japan East
    "jap"              = "japan"              # Japan
    "jap-west"         = "japanwest"          # Japan West
    "kor"              = "korea"              # Korea
    "kor-central"      = "koreacentral"       # Korea Central
    "kor-south"        = "koreasouth"         # Korea South
    "nor"              = "norway"             # Norway
    "norw-east"        = "norwayeast"         # Norway East
    "norw-west"        = "norwaywest"         # Norway West
    "nz"               = "newzealand"         # New Zealand
    "nz-north"         = "newzealandnorth"    # New Zealand North
    "pol-central"      = "polandcentral"      # Poland Central
    "qat-central"      = "qatarcentral"       # Qatar Central
    "saf-north"        = "southafricanorth"   # South Africa North
    "saf-west"         = "southafricawest"    # South Africa West
    "sgp"              = "singapore"          # Singapore
    "swe"              = "sweden"             # Sweden
    "swe-central"      = "swedencentral"      # Sweden Central
    "swe-south"        = "swedensouth"        # Sweden South
    "swz-north"        = "switzerlandnorth"   # Switzerland North
    "swz-west"         = "switzerlandwest"    # Switzerland West
    "uae-central"      = "uaecentral"         # UAE Central
    "uae-north"        = "uaenorth"           # UAE North
    "uk-south"         = "uksouth"            # UK South
    "uk"               = "uk"                 # United Kingdom
    "uk-west"          = "ukwest"             # UK West
    "us-central"       = "centralus"          # Central US
    "us-east-2"        = "eastus2"            # East US 2
    "us-east"          = "eastus"             # East US
    "us-north-central" = "northcentralus"     # North Central US
    "us-south-central" = "southcentralus"     # South Central US
    "us"               = "unitedstates"       # United States
    "us-west-2"        = "westus2"            # West US 2
    "us-west-3"        = "westus3"            # West US 3
    "us-west-central"  = "westcentralus"      # West Central US
    "us-west"          = "westus"             # West US
  }

  # Based on https://docs.microsoft.com/en-us/azure/availability-zones/cross-region-replication-azure
  # Can be retrieved by cli too:
  # `az account list-locations -o table --query '[].[displayName, name, metadata.pairedRegion[0].name]'`
  paired = {
    asia-east        = "asia-south-east"
    asia-south-east  = "asia-east"
    aus-central-2    = "aus-central"
    aus-central      = "aus-central-2"
    aus-east         = "aus-south-east"
    aus-south-east   = "aus-east"
    bra-south-east   = "bra-south"
    bra-south        = "us-south-central"
    can-central      = "can-east"
    can-east         = "can-central"
    cn-east-2        = "cn-north-2"
    cn-east-3        = "cn-north-3"
    cn-east          = "cn-north"
    cn-north-2       = "cn-east-2"
    cn-north-3       = "cn-east-3"
    cn-north         = "cn-east"
    eu-north         = "eu-west"
    eu-west          = "eu-north"
    fr-central       = "fr-south"
    fr-south         = "fr-central"
    ger-north        = "ger-west-central"
    ger-west-central = "ger-north"
    ind-central      = "ind-south"
    ind-south        = "ind-central"
    ind-west         = "ind-south"
    jap-east         = "jap-west"
    jap-west         = "jap-east"
    kor-central      = "kor-south"
    kor-south        = "kor-central"
    norw-east        = "norw-west"
    norw-west        = "norw-east"
    saf-north        = "saf-west"
    saf-west         = "saf-north"
    swe-central      = "swe-south"
    swe-south        = "swe-central"
    swz-north        = "swz-west"
    swz-west         = "swz-north"
    uae-central      = "uae-north"   # United Arab Emirates
    uae-north        = "uae-central" # United Arab Emirates
    uk-south         = "uk-west"
    uk-west          = "uk-south"
    us-central       = "us-east-2"
    us-east-2        = "us-central"
    us-east          = "us-west"
    us-north-central = "us-south-central"
    us-south-central = "us-north-central"
    us-west-2        = "us-west-central"
    us-west-3        = "us-east"
    us-west-central  = "us-west-2"
    us-west          = "us-east"
  }

  paired_region = try(local.paired[local.location_slug], null)

  # Based on https://learn.microsoft.com/en-us/azure/communication-services/concepts/privacy#data-residency
  data = {
    "asia"             = "Asia Pacific"  # Asia
    "asia-east"        = "Asia Pacific"  # East Asia
    "asia-pa"          = "Asia Pacific"  # Asia Pacific
    "asia-south-east"  = "Asia Pacific"  # Southeast Asia
    "aus"              = "Australia"     # Australia
    "aus-central-2"    = "Australia"     # Australia Central 2
    "aus-central"      = "Australia"     # Australia Central
    "aus-east"         = "Australia"     # Australia East
    "aus-south-east"   = "Australia"     # Australia Southeast
    "bra"              = "Brazil"        # Brazil
    "bra-south"        = "Brazil"        # Brazil South
    "bra-south-east"   = "Brazil"        # Brazil Southeast
    "can"              = "Canada"        # Canada
    "can-central"      = "Canada"        # Canada Central
    "can-east"         = "Canada"        # Canada East
    "cn-east-2"        = "Asia Pacific"  # "China East 2"
    "cn-east-3"        = "Asia Pacific"  # "China East 3"
    "cn-east"          = "Asia Pacific"  # "China East"
    "cn-north-2"       = "Asia Pacific"  # "China North 2"
    "cn-north-3"       = "Asia Pacific"  # "China North 3"
    "cn-north"         = "Asia Pacific"  # "China North"
    "eu"               = "Europe"        # Europe
    "eu-north"         = "Europe"        # North Europe
    "eu-west"          = "Europe"        # West Europe
    "fr-central"       = "France"        # France Central
    "fr-south"         = "France"        # France South
    "ger-central"      = "Germany"       # Germany Central
    "ger-north-east"   = "Germany"       # Germany Northeast
    "ger-north"        = "Germany"       # Germany North
    "ger-west-central" = "Germany"       # Germany West Central
    "ind-central"      = "India"         # Central India
    "ind"              = "India"         # India
    "ind-south"        = "India"         # South India
    "ind-west"         = "India"         # West India
    "isr-central"      = "Asia Pacific"  # Israel Central
    "ita-north"        = "Europe"        # Italy North
    "jap-east"         = "Japan"         # Japan East
    "jap"              = "Japan"         # Japan
    "jap-west"         = "Japan"         # Japan West
    "kor"              = "Korea"         # Korea
    "kor-central"      = "Korea"         # Korea Central
    "kor-south"        = "Korea"         # Korea South
    "nor"              = "Norway"        # Norway
    "norw-east"        = "Norway"        # Norway East
    "norw-west"        = "Norway"        # Norway West
    "pol-central"      = "Europe"        # Poland Central
    "qat-central"      = "UAE"           # Qatar Central
    "saf-north"        = "Africa"        # South Africa North
    "saf-west"         = "Africa"        # South Africa West
    "sgp"              = "Asia Pacific"  # Singapore
    "swe"              = "Europe"        # Sweden
    "swe-central"      = "Europe"        # Sweden Central
    "swe-south"        = "Europe"        # Sweden South
    "swz-north"        = "Switzerland"   # Switzerland North
    "swz-west"         = "Switzerland"   # Switzerland West
    "uae-central"      = "UAE"           # UAE Central
    "uae-north"        = "UAE"           # UAE North
    "uk-south"         = "UK"            # UK South
    "uk"               = "UK"            # United Kingdom
    "uk-west"          = "UK"            # UK West
    "us-central"       = "United States" # Central US
    "us-east-2"        = "United States" # East US 2
    "us-east"          = "United States" # East US
    "us-north-central" = "United States" # North Central US
    "us-south-central" = "United States" # South Central US
    "us"               = "United States" # United States
    "us-west-2"        = "United States" # West US 2
    "us-west-3"        = "United States" # West US 3
    "us-west-central"  = "United States" # West Central US
    "us-west"          = "United States" # West US
  }

  data_location = try(local.data[local.location_slug], null)

  geo_code = {
    "asia-east"        = "EA"
    "us-west"          = "WUS"
    "us-east"          = "EUS"
    "us-central"       = "CUS"
    "us-east-2"        = "EUS2"
    "us-north-central" = "NCUS"
    "us-south-central" = "SCUS"
    "eu-north"         = "NE"
    "eu-west"          = "WE"
    "asia-south-east"  = "SEA"
    "jap-east"         = "JPE"
    "jap-west"         = "JPW"
    "bra-south"        = "BRS"
    "aus-east"         = "AE"
    "aus-south-east"   = "ASE"
    "ind-central"      = "INC"
    "ind-south"        = "INS"
    "can-central"      = "CNC"
    "can-east"         = "CNE"
    "us-west-central"  = "WCUS"
    "us-west-2"        = "WUS2"
    "uk-west"          = "UKW"
    "uk-south"         = "UKS"
    "kor-south"        = "KRS"
    "kor-central"      = "KRC"
    "fr-central"       = "FRC"
    "fr-south"         = "FRS"
    "aus-central"      = "ACL"
    "aus-central-2"    = "ACL2"
    "uae-central"      = "UAC"
    "uae-north"        = "UAN"
    "saf-north"        = "SAN"
    "saf-west"         = "SAW"
    "ind-west"         = "INW"
    "norw-east"        = "NWE"
    "norw-west"        = "NWW"
    "swz-north"        = "SZN"
    "swz-west"         = "SZW"
    "ger-north"        = "GN"
    "ger-west-central" = "GWC"
    "swe-central"      = "SDC"
    "swe-south"        = "SDS"
    "bra-south-east"   = "BSE"
    "us-west-3"        = "WUS3"
    "qat-central"      = "QAC"
    "pol-central"      = "PLC"
    "isr-central"      = "ILC"
    "ita-north"        = "ITN"
    "nz-north"         = "NZN"
    "cn-north"         = "BJB"
    "cn-east"          = "SHA"
    "cn-north-2"       = "BJB2"
    "cn-east-2"        = "SHA2"
    "cn-north-3"       = "BJB3"
    "cn-east-3"        = "SHA3"
  }
}