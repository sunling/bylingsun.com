import json
import re
import os
from collections import Counter
from urllib.parse import urlparse
from typing import List, Dict, Tuple, Set
import math

# 简化的关键词提取算法实现
class SimpleKeywordExtractor:
    """简化的关键词提取器，实现基础的TF-IDF和RAKE算法"""
    
    def __init__(self):
        # 常见停用词
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
            'his', 'her', 'its', 'our', 'their', 'about', 'into', 'through', 'during', 'before', 'after',
            'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
            'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
            'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
            'than', 'too', 'very', 'just', 'now', 'also', 'however', 'therefore', 'thus', 'moreover',
            'furthermore', 'nevertheless', 'meanwhile', 'otherwise', 'instead', 'besides', 'although',
            'though', 'unless', 'until', 'while', 'since', 'because', 'if', 'whether', 'as', 'like'
        }
    
    def extract_tf_idf_keywords(self, text: str, title: str = "", max_keywords: int = 10) -> List[Tuple[str, float]]:
        """使用简化的TF-IDF算法提取关键词"""
        # 文本预处理
        text = text.lower()
        title = title.lower()
        
        # 提取单词
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text)
        title_words = re.findall(r'\b[a-zA-Z]{3,}\b', title)
        
        # 过滤停用词
        words = [w for w in words if w not in self.stop_words]
        title_words = [w for w in title_words if w not in self.stop_words]
        
        # 计算词频
        word_freq = Counter(words)
        total_words = len(words)
        
        # 简化的TF-IDF计算（没有真实的文档集合，使用启发式方法）
        tf_idf_scores = {}
        for word, freq in word_freq.items():
            tf = freq / total_words
            # 简化的IDF：常见词给予较低权重
            idf = math.log(1000 / (freq + 1))  # 假设文档集合大小为1000
            
            # 标题中的词给予额外权重
            title_boost = 2.0 if word in title_words else 1.0
            
            tf_idf_scores[word] = tf * idf * title_boost
        
        # 排序并返回前N个关键词
        sorted_keywords = sorted(tf_idf_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_keywords[:max_keywords]
    
    def extract_rake_keywords(self, text: str, title: str = "", max_keywords: int = 10) -> List[Tuple[str, float]]:
        """使用简化的RAKE算法提取关键词短语"""
        # 文本预处理
        text = text.lower()
        title = title.lower()
        
        # 按标点符号和停用词分割文本
        delimiters = r'[.!?;,\n\r\t]|\b(?:' + '|'.join(self.stop_words) + r')\b'
        phrases = re.split(delimiters, text)
        title_phrases = re.split(delimiters, title)
        
        # 清理短语
        phrases = [p.strip() for p in phrases if p.strip() and len(p.strip()) > 2]
        title_phrases = [p.strip() for p in title_phrases if p.strip() and len(p.strip()) > 2]
        
        # 计算词频和度数
        word_freq = Counter()
        word_degree = Counter()
        
        for phrase in phrases:
            words = re.findall(r'\b[a-zA-Z]{2,}\b', phrase)
            if len(words) > 1:  # 只考虑多词短语
                for word in words:
                    word_freq[word] += 1
                    word_degree[word] += len(words) - 1
        
        # 计算RAKE分数
        rake_scores = {}
        for phrase in phrases:
            words = re.findall(r'\b[a-zA-Z]{2,}\b', phrase)
            if len(words) > 1:
                phrase_score = sum(word_degree[w] / word_freq[w] for w in words if word_freq[w] > 0)
                
                # 标题中的短语给予额外权重
                title_boost = 2.0 if any(phrase in tp for tp in title_phrases) else 1.0
                
                rake_scores[phrase] = phrase_score * title_boost
        
        # 排序并返回前N个关键词短语
        sorted_keywords = sorted(rake_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_keywords[:max_keywords]

class TagOptimizer:
    """标签优化系统核心类"""
    
    def __init__(self, scripts_dir: str = "scripts"):
        self.scripts_dir = scripts_dir
        self.canonical_tags = {}
        self.domain_mapping = {}
        self.synonym_mapping = {}
        self.categories = {}
        self.overrides = {}
        self.keyword_extractor = SimpleKeywordExtractor()
        
        # 加载配置文件
        self._load_configurations()
    
    def _load_configurations(self):
        """加载所有配置文件"""
        try:
            # 加载受控词表
            with open(os.path.join(self.scripts_dir, 'canonical_tags.json'), 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.canonical_tags = data.get('tags', {})
                self.categories = data.get('categories', {})
            
            # 加载域名映射
            with open(os.path.join(self.scripts_dir, 'domain_mapping.json'), 'r', encoding='utf-8') as f:
                self.domain_mapping = json.load(f)
            
            # 加载同义词映射
            with open(os.path.join(self.scripts_dir, 'synonym_mapping.json'), 'r', encoding='utf-8') as f:
                self.synonym_mapping = json.load(f)
            
            # 加载人工纠偏配置
            try:
                with open(os.path.join(self.scripts_dir, 'tags_overrides.json'), 'r', encoding='utf-8') as f:
                    self.overrides = json.load(f)
            except FileNotFoundError:
                print(f"[TagOptimizer] Warning: tags_overrides.json not found, using default settings")
                self.overrides = {}
            
            print(f"[TagOptimizer] Loaded {len(self.canonical_tags)} canonical tags, {len(self.domain_mapping.get('domain_rules', {}))} domain rules")
            
        except Exception as e:
            print(f"[TagOptimizer] Warning: Failed to load configuration files: {e}")
    
    def generate_llm_candidates(self, llm_tags_en: List[str], llm_tags_zh: List[str]) -> List[str]:
        """从LLM结果生成候选标签（3-6个）"""
        candidates = []
        
        # 添加LLM生成的英文标签
        for tag in llm_tags_en[:3]:  # 最多取3个
            if tag and isinstance(tag, str):
                candidates.append(tag.strip().lower())
        
        # 添加LLM生成的中文标签的英文映射
        for tag in llm_tags_zh[:3]:  # 最多取3个
            if tag and isinstance(tag, str):
                # 尝试找到中文标签对应的英文标签
                english_tag = self._find_english_for_chinese(tag.strip())
                if english_tag:
                    candidates.append(english_tag)
        
        # 去重并限制数量
        unique_candidates = list(dict.fromkeys(candidates))  # 保持顺序的去重
        return unique_candidates[:6]  # 最多6个候选
    
    def generate_keyword_candidates(self, title: str, content: str, max_candidates: int = 8) -> List[str]:
        """使用关键词算法生成候选标签"""
        candidates = []
        
        # TF-IDF关键词
        tf_idf_keywords = self.keyword_extractor.extract_tf_idf_keywords(content, title, max_keywords=5)
        for keyword, score in tf_idf_keywords:
            if len(keyword) >= 3:  # 过滤太短的词
                candidates.append(keyword)
        
        # RAKE关键词短语
        rake_keywords = self.keyword_extractor.extract_rake_keywords(content, title, max_keywords=5)
        for phrase, score in rake_keywords:
            # 将短语转换为标签格式
            tag = re.sub(r'\s+', '-', phrase.strip())
            if len(tag) >= 3:
                candidates.append(tag)
        
        # 去重并限制数量
        unique_candidates = list(dict.fromkeys(candidates))
        return unique_candidates[:max_candidates]
    
    def generate_rule_candidates(self, url: str, title: str = "") -> List[str]:
        """基于域名和路径规则生成候选标签"""
        candidates = []
        
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            path = parsed_url.path.lower()
            
            # 移除www前缀
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # 域名规则匹配
            domain_rules = self.domain_mapping.get('domain_rules', {})
            if domain in domain_rules:
                candidates.extend(domain_rules[domain])
            
            # 路径规则匹配
            path_rules = self.domain_mapping.get('path_rules', {})
            for path_pattern, tags in path_rules.items():
                if path_pattern in path:
                    candidates.extend(tags)
            
            # 从标题中提取特定关键词
            title_lower = title.lower()
            for canonical_tag, tag_info in self.canonical_tags.items():
                aliases = tag_info.get('aliases', [])
                # 检查标题中是否包含标签或其别名
                if canonical_tag in title_lower:
                    candidates.append(canonical_tag)
                else:
                    for alias in aliases:
                        if alias.lower() in title_lower:
                            candidates.append(canonical_tag)
                            break
            
        except Exception as e:
            print(f"[TagOptimizer] Error in rule-based candidate generation: {e}")
        
        # 去重
        return list(dict.fromkeys(candidates))
    
    def normalize_candidate(self, candidate: str) -> str:
        """规范化单个候选标签"""
        if not candidate or not isinstance(candidate, str):
            return ""
        
        # 基础清理
        normalized = candidate.strip().lower()
        
        # 移除标点符号（除了连字符）
        normalized = re.sub(r'[^a-zA-Z0-9\s\-_]', '', normalized)
        
        # 将空格和下划线转换为连字符
        normalized = re.sub(r'[\s_]+', '-', normalized)
        
        # 移除多余的连字符
        normalized = re.sub(r'-+', '-', normalized)
        normalized = normalized.strip('-')
        
        # 长度限制
        if len(normalized) > 30:
            normalized = normalized[:30].rstrip('-')
        
        if len(normalized) < 2:
            return ""
        
        return normalized
    
    def map_to_canonical(self, candidate: str) -> str:
        """将候选标签映射到受控词表"""
        normalized = self.normalize_candidate(candidate)
        if not normalized:
            return ""
        
        # 1. 人工映射优先级最高
        manual_mappings = self.overrides.get('manual_mappings', {})
        if normalized in manual_mappings:
            return manual_mappings[normalized]
        
        # 2. 黑名单检查
        blacklist = self.overrides.get('blacklist', {}).get('tags', [])
        if normalized in blacklist:
            return ""  # 黑名单中的标签直接拒绝
        
        # 3. 直接匹配
        if normalized in self.canonical_tags:
            return normalized
        
        # 4. 同义词匹配
        synonyms = self.synonym_mapping.get('synonyms', {})
        for canonical_tag, synonym_list in synonyms.items():
            if normalized in [s.lower().replace(' ', '-') for s in synonym_list]:
                return canonical_tag
        
        # 5. 别名匹配
        for canonical_tag, tag_info in self.canonical_tags.items():
            aliases = tag_info.get('aliases', [])
            normalized_aliases = [self.normalize_candidate(alias) for alias in aliases]
            if normalized in normalized_aliases:
                return canonical_tag
        
        # 6. 标题模式匹配
        title_patterns = self.overrides.get('title_patterns', {}).get('patterns', {})
        for pattern, target_tag in title_patterns.items():
            if re.search(pattern, normalized):
                return target_tag
        
        return ""  # 未找到匹配
    
    def _find_english_for_chinese(self, chinese_tag: str) -> str:
        """为中文标签找到对应的英文标签"""
        for canonical_tag, tag_info in self.canonical_tags.items():
            if tag_info.get('zh', '').lower() == chinese_tag.lower():
                return canonical_tag
        return ""
    
    def calculate_candidate_score(self, candidate: str, title: str, content: str, url: str, source_name: str = "") -> float:
        """计算候选标签的综合评分"""
        score = 0.0
        
        # 获取评分调整参数
        scoring_config = self.overrides.get('scoring_adjustments', {})
        title_weight = scoring_config.get('title_weight', 3.0)
        content_weight = scoring_config.get('content_weight', 1.0)
        domain_weight_multiplier = scoring_config.get('domain_weight', 1.5)
        category_weight = scoring_config.get('category_weight', 1.2)
        manual_mapping_weight = scoring_config.get('manual_mapping_weight', 5.0)
        
        # 1. 人工映射标签获得最高权重
        manual_mappings = self.overrides.get('manual_mappings', {})
        if candidate in manual_mappings.values():
            score += manual_mapping_weight
        
        # 2. 白名单优先级
        whitelist = self.overrides.get('whitelist', {})
        high_priority_tags = whitelist.get('high_priority', [])
        boost_multiplier = whitelist.get('boost_multiplier', 1.5)
        
        if candidate in high_priority_tags:
            score *= boost_multiplier
        
        # 3. 语义相似度（基于文本匹配）
        title_lower = title.lower()
        content_lower = content.lower()
        
        # 标题匹配权重
        if candidate in title_lower:
            score += title_weight
        elif any(alias in title_lower for alias in self._get_candidate_aliases(candidate)):
            score += title_weight * 0.7
        
        # 内容匹配
        content_matches = content_lower.count(candidate)
        score += min(content_matches * content_weight * 0.1, content_weight)  # 最多加content_weight分
        
        # 4. 位置权重（标题 > 正文开头 > 正文其他部分）
        if candidate in title_lower:
            score += 2.0
        
        content_start = content_lower[:500]  # 前500字符
        if candidate in content_start:
            score += 1.0
        
        # 5. 先验热度（基于标签类别）
        canonical_tag = self.map_to_canonical(candidate)
        if canonical_tag:
            tag_info = self.canonical_tags.get(canonical_tag, {})
            category = tag_info.get('category', '')
            
            # 类别偏好
            category_prefs = self.overrides.get('category_preferences', {})
            preferred_categories = category_prefs.get('preferred_categories', [])
            avoid_categories = category_prefs.get('avoid_categories', [])
            
            if category in preferred_categories:
                score += category_weight * 1.5
            elif category in avoid_categories:
                score -= category_weight * 0.5
            else:
                # 默认类别权重
                category_weights = {
                    'technology': 1.5,
                    'ai': 1.8,
                    'business': 1.3,
                    'programming': 1.4,
                    'company': 1.2,
                    'general': 1.0
                }
                score += category_weights.get(category, 1.0) * category_weight
        
        # 6. 源站权重
        try:
            domain = urlparse(url).netloc.lower()
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # 检查域名覆盖配置
            domain_overrides = self.overrides.get('domain_overrides', {})
            if domain in domain_overrides:
                domain_config = domain_overrides[domain]
                boost_categories = domain_config.get('boost_categories', [])
                
                if canonical_tag:
                    tag_info = self.canonical_tags.get(canonical_tag, {})
                    category = tag_info.get('category', '')
                    if category in boost_categories:
                        score *= 1.3
            
            # 权威源站权重
            authoritative_domains = {
                'arxiv.org': 1.5,
                'nature.com': 1.5,
                'techcrunch.com': 1.3,
                'wired.com': 1.3,
                'arstechnica.com': 1.3,
                'github.com': 1.4,
                'openai.com': 1.6,
                'google.com': 1.4,
                'apple.com': 1.4,
                'microsoft.com': 1.4
            }
            
            domain_weight = authoritative_domains.get(domain, 1.0)
            score *= domain_weight * domain_weight_multiplier
            
        except Exception:
            pass
        
        return score
    
    def _get_candidate_aliases(self, candidate: str) -> List[str]:
        """获取候选标签的所有别名"""
        aliases = []
        
        # 从同义词映射中查找
        synonyms = self.synonym_mapping.get('synonyms', {})
        for canonical_tag, synonym_list in synonyms.items():
            if candidate == canonical_tag or candidate in [s.lower().replace(' ', '-') for s in synonym_list]:
                aliases.extend([s.lower().replace(' ', '-') for s in synonym_list])
                break
        
        # 从受控词表中查找
        canonical_tag = self.map_to_canonical(candidate)
        if canonical_tag and canonical_tag in self.canonical_tags:
            tag_aliases = self.canonical_tags[canonical_tag].get('aliases', [])
            aliases.extend([self.normalize_candidate(alias) for alias in tag_aliases])
        
        return list(set(aliases))  # 去重
    
    def get_fallback_tags(self, candidates: List[str]) -> List[str]:
        """当所有候选标签评分都过低时，返回父类标签"""
        fallback_tags = []
        
        # 分析候选标签，推断可能的父类
        tech_keywords = ['ai', 'tech', 'software', 'digital', 'computer', 'internet', 'web', 'app', 'code']
        business_keywords = ['business', 'startup', 'company', 'market', 'finance', 'investment', 'entrepreneur']
        science_keywords = ['science', 'research', 'study', 'analysis', 'data', 'experiment', 'discovery']
        
        candidates_text = ' '.join(candidates).lower()
        
        if any(keyword in candidates_text for keyword in tech_keywords):
            fallback_tags.append('technology')
        
        if any(keyword in candidates_text for keyword in business_keywords):
            fallback_tags.append('business')
        
        if any(keyword in candidates_text for keyword in science_keywords):
            fallback_tags.append('science')
        
        # 如果没有明确的类别，返回通用标签
        if not fallback_tags:
            fallback_tags = ['technology']  # 默认回退到技术类
        
        return fallback_tags[:2]  # 最多返回2个
    
    def optimize_tags(self, llm_tags_en: List[str], llm_tags_zh: List[str], 
                     title: str, content: str, url: str, source_name: str = "") -> Tuple[List[str], List[str]]:
        """主要的标签优化函数"""
        try:
            # 1. 生成多路候选
            llm_candidates = self.generate_llm_candidates(llm_tags_en, llm_tags_zh)
            keyword_candidates = self.generate_keyword_candidates(title, content)
            rule_candidates = self.generate_rule_candidates(url, title)
            
            # 合并所有候选
            all_candidates = llm_candidates + keyword_candidates + rule_candidates
            
            # 2. 规范化映射
            mapped_candidates = []
            unknown_candidates = []  # 记录未命中词典的候选
            
            for candidate in all_candidates:
                canonical = self.map_to_canonical(candidate)
                if canonical:
                    mapped_candidates.append(canonical)
                else:
                    # 记录未映射成功的候选
                    if candidate and len(candidate) >= 2:  # 过滤太短的候选
                        unknown_candidates.append(candidate)
            
            # 记录未知候选到日志
            if unknown_candidates:
                self.log_unknown_candidates(unknown_candidates, title, url)
            
            # 3. 评分筛选
            scored_candidates = []
            for candidate in set(mapped_candidates):  # 去重
                score = self.calculate_candidate_score(candidate, title, content, url, source_name)
                scored_candidates.append((candidate, score))
            
            # 按分数排序
            scored_candidates.sort(key=lambda x: x[1], reverse=True)
            
            # 4. 选择最终标签
            final_tags = []
            scoring_config = self.overrides.get('scoring_adjustments', {})
            score_threshold = scoring_config.get('minimum_score_threshold', 1.0)
            fallback_threshold = scoring_config.get('fallback_threshold', 0.5)
            
            # 首先尝试高分标签
            for candidate, score in scored_candidates:
                if score >= score_threshold and len(final_tags) < 2:
                    final_tags.append(candidate)
            
            # 如果高分标签不足，降低阈值
            if len(final_tags) < 2:
                for candidate, score in scored_candidates:
                    if score >= fallback_threshold and candidate not in final_tags and len(final_tags) < 2:
                        final_tags.append(candidate)
            
            # 5. 如果仍然没有足够的标签，使用回退策略
            if len(final_tags) == 0:
                final_tags = self.get_fallback_tags(all_candidates)
            elif len(final_tags) == 1:
                fallback = self.get_fallback_tags(all_candidates)
                if fallback and fallback[0] not in final_tags:
                    final_tags.append(fallback[0])
            
            # 6. 应用域名默认标签（如果配置了）
            try:
                domain = urlparse(url).netloc.lower()
                if domain.startswith('www.'):
                    domain = domain[4:]
                
                domain_overrides = self.overrides.get('domain_overrides', {})
                if domain in domain_overrides:
                    default_tags = domain_overrides[domain].get('default_tags', [])
                    for default_tag in default_tags:
                        if default_tag not in final_tags and len(final_tags) < 2:
                            final_tags.append(default_tag)
            except Exception:
                pass
            
            # 7. 生成对应的中文标签
            final_tags_zh = []
            for tag in final_tags:
                if tag in self.canonical_tags:
                    zh_tag = self.canonical_tags[tag].get('zh', tag)
                    final_tags_zh.append(zh_tag)
                else:
                    final_tags_zh.append(tag)  # 如果没有中文对应，使用英文
            
            print(f"[TagOptimizer] Generated {len(final_tags)} optimized tags: {final_tags}")
            if unknown_candidates:
                print(f"[TagOptimizer] Logged {len(unknown_candidates)} unknown candidates: {unknown_candidates[:3]}...")
            
            return final_tags, final_tags_zh
            
        except Exception as e:
            print(f"[TagOptimizer] Error in tag optimization: {e}")
            # 出错时返回原始LLM标签（截断到2个）
            return llm_tags_en[:2], llm_tags_zh[:2]
    
    def log_unknown_candidates(self, unknown_candidates: List[str], title: str, url: str):
        """记录未命中词典的候选标签"""
        if not unknown_candidates:
            return
        
        log_file = os.path.join(self.scripts_dir, 'tags_unknown.ndjson')
        log_entry = {
            'timestamp': __import__('datetime').datetime.now().isoformat(),
            'title': title,
            'url': url,
            'unknown_candidates': unknown_candidates
        }
        
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
        except Exception as e:
            print(f"[TagOptimizer] Warning: Failed to log unknown candidates: {e}")